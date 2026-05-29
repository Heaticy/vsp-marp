[CmdletBinding(SupportsShouldProcess = $true)]
param(
  [switch]$Force,
  [string]$CacheDir
)

$ErrorActionPreference = "Stop"

if (-not $IsWindows -and $PSVersionTable.PSEdition -eq "Core") {
  throw "This script is intended for Windows PowerShell/PowerShell on Windows."
}

$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
if (-not $CacheDir) {
  $CacheDir = Join-Path $scriptDir "..\.marp-cache\fonts"
}

$cachePath = [System.IO.Path]::GetFullPath($CacheDir)
$userFontDir = Join-Path $env:LOCALAPPDATA "Microsoft\Windows\Fonts"
$fontRegistryPath = "HKCU:\Software\Microsoft\Windows NT\CurrentVersion\Fonts"
$machineFontRegistryPath = "HKLM:\Software\Microsoft\Windows NT\CurrentVersion\Fonts"
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

$fontGroups = @(
  @{
    Name = "Latin Modern"
    BaseUrl = "https://heaticy-1310163554.cos.ap-shanghai.myqcloud.com/vsp-marp/assets/fonts/latin-modern"
    Fonts = @(
      @{ File = "lmroman10-regular.otf"; RegistryName = "Latin Modern Roman 10 Regular (OpenType)" },
      @{ File = "lmroman10-bold.otf"; RegistryName = "Latin Modern Roman 10 Bold (OpenType)" },
      @{ File = "lmsans10-regular.otf"; RegistryName = "Latin Modern Sans 10 Regular (OpenType)" },
      @{ File = "lmsans10-bold.otf"; RegistryName = "Latin Modern Sans 10 Bold (OpenType)" },
      @{ File = "lmmono10-regular.otf"; RegistryName = "Latin Modern Mono 10 Regular (OpenType)" },
      @{ File = "lmmonolt10-bold.otf"; RegistryName = "Latin Modern Mono Light 10 Bold (OpenType)" }
    )
  },
  @{
    Name = "Noto CJK"
    BaseUrl = "https://heaticy-1310163554.cos.ap-shanghai.myqcloud.com/vsp-marp/assets/fonts/noto"
    Fonts = @(
      @{ File = "NotoSerifCJKsc-Regular.otf"; RegistryName = "Noto Serif CJK SC Regular (OpenType)" },
      @{ File = "NotoSerifCJKsc-Bold.otf"; RegistryName = "Noto Serif CJK SC Bold (OpenType)" },
      @{ File = "NotoSansCJKsc-Regular.otf"; RegistryName = "Noto Sans CJK SC Regular (OpenType)" },
      @{ File = "NotoSansCJKsc-Bold.otf"; RegistryName = "Noto Sans CJK SC Bold (OpenType)" },
      @{ File = "NotoSansMonoCJKsc-Regular.otf"; RegistryName = "Noto Sans Mono CJK SC Regular (OpenType)" },
      @{ File = "NotoSansMonoCJKsc-Bold.otf"; RegistryName = "Noto Sans Mono CJK SC Bold (OpenType)" }
    )
  }
)

function Test-FontInstalled {
  param(
    [string]$RegistryName,
    [string]$FileName,
    [string]$InstalledPath
  )

  foreach ($path in @($fontRegistryPath, $machineFontRegistryPath)) {
    $registryItem = Get-ItemProperty -Path $path -ErrorAction SilentlyContinue
    if (-not $registryItem) {
      continue
    }

    $value = $registryItem.$RegistryName
    if ($value) {
      return $true
    }

    $matchingValue = $registryItem.PSObject.Properties |
      Where-Object {
        $_.Name -like "*$($FileName -replace '\.otf$', '')*" -or
        ($_.Value -is [string] -and ($_.Value -ieq $FileName -or $_.Value -ieq $InstalledPath -or $_.Value -like "*\$FileName"))
      } |
      Select-Object -First 1

    if ($matchingValue) {
      return $true
    }
  }

  return (Test-Path -LiteralPath $InstalledPath)
}

New-Item -ItemType Directory -Force -Path $cachePath, $userFontDir | Out-Null
New-Item -Force -Path $fontRegistryPath | Out-Null

Write-Host "Installing VSP-Marp fonts for current user."
Write-Host "Cache: $cachePath"
Write-Host "User font directory: $userFontDir"
Write-Host "Font registry names use the original OTF metadata, without a Heaticy prefix."
if (-not $isAdmin) {
  Write-Host "Administrator privileges were not detected and are not required for current-user installation."
}

foreach ($group in $fontGroups) {
  Write-Host "== $($group.Name) =="
  $groupCachePath = Join-Path $cachePath ($group.Name.ToLower().Replace(' ', '-'))
  New-Item -ItemType Directory -Force -Path $groupCachePath | Out-Null

  foreach ($font in $group.Fonts) {
    $downloadPath = Join-Path $groupCachePath $font.File
    $installedPath = Join-Path $userFontDir $font.File
    $alreadyInstalled = Test-FontInstalled -RegistryName $font.RegistryName -FileName $font.File -InstalledPath $installedPath

    if ($alreadyInstalled -and -not $Force) {
      Write-Host "Installed: $($font.File)"
      continue
    }

    if ((Test-Path -LiteralPath $downloadPath) -and -not $Force) {
      Write-Host "Downloaded: $($font.File)"
    } else {
      $uri = "$($group.BaseUrl)/$($font.File)"
      if ($PSCmdlet.ShouldProcess($downloadPath, "Download $uri")) {
        Write-Host "Downloading: $uri"
        Invoke-WebRequest -Uri $uri -OutFile $downloadPath
      }
    }

    if ($PSCmdlet.ShouldProcess($installedPath, "Install $($font.File) for current user")) {
      Write-Host "Installing: $($font.File)"
      Copy-Item -LiteralPath $downloadPath -Destination $installedPath -Force
      New-ItemProperty -Path $fontRegistryPath -Name $font.RegistryName -PropertyType String -Value $installedPath -Force | Out-Null
    }
  }
}

$signature = @"
using System;
using System.Runtime.InteropServices;

public static class FontChangeNotifier {
  [DllImport("user32.dll", SetLastError = true)]
  public static extern IntPtr SendMessageTimeout(
    IntPtr hWnd,
    uint Msg,
    UIntPtr wParam,
    string lParam,
    uint fuFlags,
    uint uTimeout,
    out UIntPtr lpdwResult);
}
"@

Add-Type -TypeDefinition $signature -ErrorAction SilentlyContinue
$result = [UIntPtr]::Zero
[FontChangeNotifier]::SendMessageTimeout([IntPtr]0xffff, 0x001D, [UIntPtr]::Zero, $null, 0x0002, 5000, [ref]$result) | Out-Null

Write-Host "Done. Restart VS Code, browsers, or terminals that were opened before installation."
