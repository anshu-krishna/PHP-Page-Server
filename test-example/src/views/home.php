<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>ABC</title>
</head>
<body>
[[ `common/header.php` ]]
<p>
	<strong>Welcome to home page;</strong>
</p>
<p>
	<code>\[[ `common/header.php` ]]</code> is used to add the common header in all the pages. From the common header file this imports:<pre><code>[- `common/header.php` -]</code></pre>
</p>
<p>
	<strong>Server config is:</strong>
	<?php var_dump($_SERVER_CFG); ?>
</p>
</body>
</html>