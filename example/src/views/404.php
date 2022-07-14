<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>ABC</title>
</head>
<body>
[[ `common/header.php` ]]
<p>
	404: Page not found;
</p>
<small>Path: example.com/<?= htmlentities(implode('/', $_URL)); ?></small>
</body>
</html>