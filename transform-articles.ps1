$blogDir = "C:\Users\ericg\Documents\PESSOAL\DEV\site-malupepe-arquitetura\blog"
$files = Get-ChildItem -Path $blogDir -Filter "*.html" | Where-Object { $_.Name -ne "index.html" }

$monthsPT = @('jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez')

$fontsLink = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@300;400&display=swap" rel="stylesheet">'

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)

    # Extract title
    $titleMatch = [regex]::Match($content, '<title>(.*?)</title>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
    $title = if ($titleMatch.Success) { $titleMatch.Groups[1].Value.Trim() } else { $file.BaseName }

    # Extract date
    $dateMatch = [regex]::Match($content, '<strong>Data:</strong>\s*([\d\-T:]+)')
    $dateFormatted = ''
    if ($dateMatch.Success) {
        try {
            $dt = [datetime]::Parse($dateMatch.Groups[1].Value)
            $mon = $monthsPT[$dt.Month - 1]
            $dateFormatted = "$($dt.Day) $mon $($dt.Year)"
        } catch { $dateFormatted = '' }
    }

    # Extract <main> content
    $mainMatch = [regex]::Match($content, '<main>(.*?)</main>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
    $mainContent = if ($mainMatch.Success) { $mainMatch.Groups[1].Value.Trim() } else { '' }

    # Build new HTML
    $dateBlock = if ($dateFormatted) { "        <span class=`"ba-date`">$dateFormatted</span>`n" } else { '' }

    $newHtml = @"
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>$title</title>
  $fontsLink
  <link rel="stylesheet" href="../css/base.css">
  <link rel="stylesheet" href="../css/components.css">
  <link rel="stylesheet" href="article.css">
</head>
<body>

  <nav class="ba-nav">
    <a href="/" class="ba-nav__brand">Malu Pepe Arquitetura</a>
    <a href="/blog/" class="ba-nav__back">&#8592; Blog</a>
  </nav>

  <main class="ba-main">

    <div class="ba-header">
$($dateBlock)      <h1 class="ba-title">$title</h1>
    </div>

    <div class="ba-body">
$mainContent
    </div>

    <div class="ba-cta">
      <p>Tem um projeto em mente?</p>
      <a href="/#contato" class="ba-cta__link">Vamos conversar &rarr;</a>
    </div>

  </main>

  <footer class="ba-footer">
    <p>&copy; Malu Pepe Arquitetura &mdash; <a href="/">malupepearquitetura.com.br</a></p>
  </footer>

</body>
</html>
"@

    [System.IO.File]::WriteAllText($file.FullName, $newHtml, [System.Text.Encoding]::UTF8)
    Write-Host "OK: $($file.Name)"
}

Write-Host "`nDone. $($files.Count) files transformed."
