# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (c) 2026 gikipil. Localized setup errors; raw engine logs stay intact.
$script:errorMessages = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'error-messages.json') -Raw -Encoding UTF8 | ConvertFrom-Json
function Translate-SetupError([AllowNull()][string]$Message) {
    $language=if($script:languageCode -in @('en','ru','fr','es','zh','ja')){$script:languageCode}else{'en'}
    if($Message -and $script:translations -and $script:translations.ContainsKey($Message)){return $Message}
    foreach($entry in ($script:errorMessages.PSObject.Properties | Sort-Object {$_.Name.Length} -Descending)) {
        $key=$entry.Name
        if($key -eq '_fallback'){continue}
        # Translate only our own leading explanation, never paths or tool logs.
        $isKnownMessage=$Message -eq $key -or ($Message -and $Message.StartsWith($key) -and ($key.EndsWith(' ') -or $Message.Substring($key.Length).StartsWith("`n") -or $Message.Substring($key.Length).StartsWith("`r`n")))
        if($isKnownMessage){return [string]$entry.Value.$language+$Message.Substring($key.Length)}
    }
    $hint=[string]$script:errorMessages._fallback.$language
    if([string]::IsNullOrWhiteSpace($Message)){return $hint}
    return $hint+"`r`n`r`n"+$Message
}
