# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (c) 2026 gikipil. Windows installer UI. No administrator rights required.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()
$env:PYTHONIOENCODING = 'utf-8'
$env:PYTHONUTF8 = '1'
$bundle = Split-Path $PSScriptRoot -Parent
$script:languageCodes = @('en','ru','fr','es','zh','ja')
$systemLanguage = (Get-UICulture).TwoLetterISOLanguageName
$script:languageCode = if($systemLanguage -in $script:languageCodes){$systemLanguage}else{'en'}
$script:catalog = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'languages.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$script:translations = @{}
function T($en, $russian) {
    $entry=$script:catalog.PSObject.Properties[$en]
    if($entry){
        foreach($text in $entry.Value.PSObject.Properties){$script:translations[$text.Value]=$en}
        $localized=$entry.Value.PSObject.Properties[$script:languageCode]
        if($localized){return $localized.Value}
    }
    $script:translations[$en]=$en;$script:translations[$russian]=$en
    if($script:languageCode -eq 'ru'){return $russian};return $en
}
. (Join-Path $PSScriptRoot 'messages.ps1')
if (-not (Test-Path -LiteralPath (Join-Path $bundle 'package'))) {
    [System.Windows.Forms.MessageBox]::Show((Translate-SetupError 'Download and extract the complete Windows installer ZIP from Releases. The GitHub source ZIP is not the installation bundle.'),'Universal Workflow') | Out-Null
    exit 1
}
$form = New-Object System.Windows.Forms.Form
$form.Text = T 'Universal Workflow - Setup' 'Universal Workflow — Установка';$form.Size = New-Object System.Drawing.Size(790,694);$form.MinimumSize = $form.Size;$form.StartPosition = 'CenterScreen'
$form.Font = New-Object System.Drawing.Font('Segoe UI',10)
$label = New-Object System.Windows.Forms.Label
$label.Text = T 'Select your existing ComfyUI folder (or its portable parent). Models are NOT downloaded.' 'Выберите папку установленного ComfyUI или его portable-папку. Модели НЕ скачиваются.'
$label.SetBounds(20,16,730,52);$form.Controls.Add($label)
$rootBox = New-Object System.Windows.Forms.TextBox;$rootBox.SetBounds(20,73,620,30);$form.Controls.Add($rootBox)
$browse = New-Object System.Windows.Forms.Button;$browse.Text = T 'Browse...' 'Выбрать...';$browse.SetBounds(650,70,105,34);$form.Controls.Add($browse)
$browse.Add_Click({$dialog=New-Object System.Windows.Forms.FolderBrowserDialog;if($dialog.ShowDialog() -eq 'OK'){$rootBox.Text=$dialog.SelectedPath}})
$pythonLabel=New-Object System.Windows.Forms.Label;$pythonLabel.Text=T 'ComfyUI Python (detected automatically; change only if needed)' 'Python вашего ComfyUI (определяется автоматически; можно выбрать вручную)';$pythonLabel.SetBounds(20,115,730,24);$form.Controls.Add($pythonLabel)
$pythonBox=New-Object System.Windows.Forms.TextBox;$pythonBox.SetBounds(20,143,620,30);$form.Controls.Add($pythonBox)
$pickPython=New-Object System.Windows.Forms.Button;$pickPython.Text=T 'Browse...' 'Выбрать...';$pickPython.SetBounds(650,140,105,34);$form.Controls.Add($pickPython)
$pickPython.Add_Click({$dialog=New-Object System.Windows.Forms.OpenFileDialog;$dialog.Filter='ComfyUI Python|python.exe';if($dialog.ShowDialog() -eq 'OK'){$pythonBox.Text=$dialog.FileName}})
$full=New-Object System.Windows.Forms.CheckBox;$full.Text=T 'Prepare all features, including video and sound (NVIDIA; Python 3.12 recommended)' 'Подготовить все функции, включая видео и звук (NVIDIA; рекомендуется Python 3.12)';$full.Checked=$true;$full.SetBounds(20,185,735,32);$form.Controls.Add($full)
$note=New-Object System.Windows.Forms.Label;$note.Text=T 'Checks may download node source and package metadata. Changes to ComfyUI/Python are made only after you approve the plan. Close ComfyUI before setup.' 'Проверка может скачивать исходники нод и сведения о пакетах. Изменения ComfyUI/Python — только после подтверждения плана. Перед установкой закройте ComfyUI.';$note.SetBounds(20,225,730,62);$form.Controls.Add($note)
$output=New-Object System.Windows.Forms.TextBox;$output.Multiline=$true;$output.ReadOnly=$true;$output.ScrollBars='Vertical';$output.SetBounds(20,294,735,235);$output.Anchor='Top,Bottom,Left,Right';$form.Controls.Add($output)
$button=New-Object System.Windows.Forms.Button;$button.Text=T 'Check and prepare' 'Проверить и подготовить';$button.SetBounds(20,547,265,42);$button.Anchor='Bottom,Left';$form.Controls.Add($button)
$logs=New-Object System.Windows.Forms.Button;$logs.Text=T 'Open log folder' 'Открыть журнал';$logs.SetBounds(300,547,210,42);$logs.Anchor='Bottom,Left';$logs.Enabled=$false;$form.Controls.Add($logs)
$close=New-Object System.Windows.Forms.Button;$close.Text=T 'Close' 'Закрыть';$close.SetBounds(650,547,105,42);$close.Anchor='Bottom,Right';$form.Controls.Add($close)
$script:process=$null;$script:workspace=$null;$script:phase='prepare';$script:prepared=$false
$timer=New-Object System.Windows.Forms.Timer;$timer.Interval=600
function Q([string]$value) { return '"' + $value.TrimEnd('\').Replace('"','\"') + '"' }
function Start-Engine($action) {
    $script:phase=$action
    $resultFile=Join-Path $script:workspace 'result.json'
    if(Test-Path -LiteralPath $resultFile){Move-Item -LiteralPath $resultFile -Destination (Join-Path $script:workspace ('result-before-'+$action+'-'+[DateTime]::Now.Ticks+'.json'))}
    $mode=if($full.Checked){'all'}else{'images'}
    $arguments=@('-u',(Q (Join-Path $PSScriptRoot 'engine.py')),'--action',$action,'--root',(Q $rootBox.Text),'--bundle',(Q $bundle),'--workspace',(Q $script:workspace),'--mode',$mode)
    if($action -eq 'install'){$arguments+='--approved'}
    $script:process=Start-Process -FilePath $pythonBox.Text -ArgumentList $arguments -WindowStyle Hidden -RedirectStandardOutput (Join-Path $script:workspace ($action+'.log')) -RedirectStandardError (Join-Path $script:workspace ($action+'-errors.log')) -PassThru
    # Keep the native handle: Windows PowerShell otherwise loses ExitCode after exit.
    $null=$script:process.Handle
    $button.Text=if($action -eq 'install'){T 'Installing...' 'Установка...'}else{T 'Preparing...' 'Подготовка...'}
    $language.Enabled=$false;$button.Enabled=$false;$browse.Enabled=$false;$pickPython.Enabled=$false;$rootBox.ReadOnly=$true;$pythonBox.ReadOnly=$true;$full.Enabled=$false;$close.Enabled=($action -eq 'prepare');$close.Text=if($action -eq 'prepare'){T 'Cancel' 'Отмена'}else{T 'Close' 'Закрыть'};$logs.Enabled=$true;$timer.Start()
}
$button.Add_Click({
    try {
        if($script:prepared){
            $answer=[System.Windows.Forms.MessageBox]::Show((T 'Install the changes shown in the plan?' 'Выполнить изменения из показанного плана?'),'Universal Workflow',[System.Windows.Forms.MessageBoxButtons]::YesNo,[System.Windows.Forms.MessageBoxIcon]::Question,[System.Windows.Forms.MessageBoxDefaultButton]::Button2)
            if($answer -eq 'Yes'){Start-Engine 'install'};return
        }
        if(-not (Test-Path -LiteralPath $rootBox.Text -PathType Container)){throw (T 'Select a ComfyUI folder.' 'Выберите папку ComfyUI.')}
        if(-not $pythonBox.Text){
            $root=$rootBox.Text;if(Test-Path -LiteralPath (Join-Path $root 'ComfyUI\main.py')){$root=Join-Path $root 'ComfyUI'}
            $parent=Split-Path $root -Parent
            $candidates=@((Join-Path $root '.venv\Scripts\python.exe'),(Join-Path $root 'venv\Scripts\python.exe'),(Join-Path $parent 'python_embeded\python.exe'),(Join-Path $parent 'python_embedded\python.exe'))
            $pythonBox.Text=($candidates | Where-Object {Test-Path -LiteralPath $_} | Select-Object -First 1)
        }
        if(-not (Test-Path -LiteralPath $pythonBox.Text -PathType Leaf)){throw (T 'Select the python.exe used by ComfyUI.' 'Укажите python.exe, которым запускается ComfyUI.')}
        $script:workspace=Join-Path $env:LOCALAPPDATA ('UniversalWorkflow\Setup\'+(Get-Date -Format 'yyyyMMdd-HHmmss-fff'));New-Item -ItemType Directory -Path $script:workspace -Force | Out-Null
        $output.Text=T 'Checking environment and preparing an installation plan...' 'Проверка окружения и подготовка плана установки...';Start-Engine 'prepare'
    }catch{[System.Windows.Forms.MessageBox]::Show((Translate-SetupError $_.Exception.Message),'Universal Workflow')|Out-Null}
})
$timer.Add_Tick({
    $path=Join-Path $script:workspace ($script:phase+'.log');if(Test-Path -LiteralPath $path){$output.Text=(Get-Content -LiteralPath $path -Tail 30 -Encoding UTF8)-join "`r`n";$output.SelectionStart=$output.TextLength;$output.ScrollToCaret()}
    if(-not $script:process.HasExited){return}
    $timer.Stop();$script:process.WaitForExit();$close.Enabled=$true;$close.Text=T 'Close' 'Закрыть'
    try {
        $result=Get-Content -LiteralPath (Join-Path $script:workspace 'result.json') -Raw -Encoding UTF8 | ConvertFrom-Json
        $exitCode=$script:process.ExitCode
        if($null -eq $exitCode){throw 'Could not read the setup process exit code. Open the log folder for details.'}
        if(-not $result.ok -or $exitCode -ne 0){
            $detail=[string]$result.error
            if([string]::IsNullOrWhiteSpace($detail)){$detail=[string](Get-Content -LiteralPath (Join-Path $script:workspace ($script:phase+'-errors.log')) -Raw -Encoding UTF8)}
            if([string]::IsNullOrWhiteSpace($detail)){$detail='Setup process failed (exit code '+$exitCode+'). Open the log folder for details.'}
            throw $detail
        }
        if($script:phase -eq 'prepare'){
            $plan=$result.result
            $lines=@(('ComfyUI: '+$plan.root),('Python: '+$plan.python),('GPU: '+$plan.gpu),'')
            if($plan.update_comfy){$lines+=(T 'ComfyUI will be updated to the compatible version (file backup included).' 'ComfyUI будет обновлён до совместимой версии с резервной копией файлов.')}
            if($plan.update_video_runtime){$lines+=(T 'The CUDA13 video runtime will be installed.' 'Будет установлен видеорежим CUDA13.')}
            $lines+=@('',(T 'Nodes and interface:' 'Ноды и интерфейс:'))
            foreach($source in $plan.sources){if($source.copy){$name=Split-Path $source.destination -Leaf;$verb=if(Test-Path -LiteralPath $source.destination){T 'Update with backup' 'Обновить с резервной копией'}else{T 'Install' 'Установить'};$lines+=($verb+': '+$name)}}
            $lines+=@('',(T 'Python package changes:' 'Изменения пакетов Python:'))
            foreach($item in $plan.updates){$lines+=($item.name+': '+$item.old+' -> '+$item.new)}
            $lines+=@('',(T 'Node packs and interface will be installed. Existing files are backed up. No models will be downloaded.' 'Будут установлены ноды и интерфейс. Заменяемые файлы сохраняются в резервной копии. Модели не скачиваются.'),(T 'Approve these changes?' 'Разрешить эти изменения?'))
            $output.Text=$lines -join "`r`n"
            $script:prepared=$true;$button.Text=T 'Install this plan' 'Установить по этому плану'
        }else{
            $script:prepared=$false;$button.Text=T 'Check and prepare' 'Проверить и подготовить'
            $output.Text=T 'Installed. Start ComfyUI as usual, open the new workflow, and press ND UI. Choose models yourself in Settings / Help. Help is a recommendation catalog, not a mandatory list.' 'Установлено. Запустите ComfyUI как обычно, откройте новый workflow и нажмите ND UI. Модели выбирайте сами в Settings / Help. Help — рекомендации, а не обязательный список.'
        }
    }catch{$script:prepared=$false;$button.Text=T 'Check and prepare' 'Проверить и подготовить';$output.Text=Translate-SetupError $_.Exception.Message;[System.Windows.Forms.MessageBox]::Show($output.Text,'Universal Workflow')|Out-Null}
    $language.Enabled=$true;$button.Enabled=$true;$browse.Enabled=$true;$pickPython.Enabled=$true;$rootBox.ReadOnly=$false;$pythonBox.ReadOnly=$false;$full.Enabled=$true
})
function Reset-Plan {$script:prepared=$false;$button.Text=T 'Check and prepare' 'Проверить и подготовить'}
$rootBox.Add_TextChanged({Reset-Plan});$pythonBox.Add_TextChanged({Reset-Plan});$full.Add_CheckedChanged({Reset-Plan})
$logs.Add_Click({if($script:workspace){Start-Process explorer.exe -ArgumentList (Q $script:workspace) -WindowStyle Normal}})
$close.Add_Click({$form.Close()})
$form.Add_FormClosing({
    param($sender,$event)
    if($script:process -and -not $script:process.HasExited){
        $event.Cancel=$true
        if($script:phase -eq 'prepare'){
            $answer=[System.Windows.Forms.MessageBox]::Show((T 'Cancel preparation? Installed ComfyUI/Python files have not been changed.' 'Отменить подготовку? Файлы установленного ComfyUI и Python ещё не менялись.'),'Universal Workflow',[System.Windows.Forms.MessageBoxButtons]::YesNo,[System.Windows.Forms.MessageBoxIcon]::Question,[System.Windows.Forms.MessageBoxDefaultButton]::Button2)
            if($answer -eq 'Yes'){$timer.Stop();Start-Process -FilePath taskkill.exe -ArgumentList @('/PID',$script:process.Id,'/T','/F') -WindowStyle Hidden -Wait;$event.Cancel=$false}
        }else{[System.Windows.Forms.MessageBox]::Show((T 'Please wait for installation to finish.' 'Дождитесь завершения установки.'),'Universal Workflow')|Out-Null}
    }
})
# Reserve a compact language row without changing the installation controls.
foreach ($control in $form.Controls) { $control.Top += 44 }
$languageLabel=New-Object System.Windows.Forms.Label
$languageLabel.Text='Language';$languageLabel.SetBounds(20,16,170,24);$form.Controls.Add($languageLabel)
$language=New-Object System.Windows.Forms.ComboBox
$language.DropDownStyle='DropDownList';$language.SetBounds(195,12,200,30)
$language.Items.AddRange(@('English','Русский','Français','Español','简体中文','日本語'))
$language.SelectedIndex=[Array]::IndexOf($script:languageCodes,$script:languageCode);$form.Controls.Add($language)
$language.Add_SelectedIndexChanged({
    $script:languageCode=$script:languageCodes[$language.SelectedIndex]
    foreach($control in @($form)+@($form.Controls)) {
        if($script:translations.ContainsKey($control.Text)) {
            $key=$script:translations[$control.Text]
            $control.Text=T $key $key
        }
    }
    # An already prepared plan must be displayed in the chosen language again.
    Reset-Plan
    $output.Clear()
})
[System.Windows.Forms.Application]::Run($form)
