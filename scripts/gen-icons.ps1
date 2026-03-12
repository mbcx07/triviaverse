Add-Type -AssemblyName System.Drawing

function New-Icon {
  param(
    [Parameter(Mandatory=$true)][string]$Path,
    [Parameter(Mandatory=$true)][int]$Size
  )

  $bmp = New-Object System.Drawing.Bitmap $Size, $Size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear([System.Drawing.Color]::FromArgb(16,185,129))

  $font = New-Object System.Drawing.Font 'Arial', ([float]($Size * 0.5)), ([System.Drawing.FontStyle]::Bold)
  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = [System.Drawing.StringAlignment]::Center
  $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  $g.DrawString('T', $font, [System.Drawing.Brushes]::White, (New-Object System.Drawing.RectangleF 0,0,$Size,$Size), $sf)
  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)

  $g.Dispose()
  $bmp.Dispose()
}

New-Icon -Path "C:\Users\Administrator\.openclaw\workspace\triviaverse\web\public\pwa-192x192.png" -Size 192
New-Icon -Path "C:\Users\Administrator\.openclaw\workspace\triviaverse\web\public\pwa-512x512.png" -Size 512
