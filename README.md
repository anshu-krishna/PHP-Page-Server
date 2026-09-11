# Krishna Page Server (KPS)

A lightweight, template-based PHP web framework for building dynamic websites with declarative routing and powerful template syntax.

## Features

- **Declarative Routing**: Define routes and views using an intuitive syntax
- **Template Engine**: Built-in template syntax with support for dynamic values and file includes
- **Query Handling**: Automatic parsing of GET, POST, and JSON request bodies
- **Development Mode**: Built-in debugging and error reporting
- **Lightweight**: Minimal dependencies, fast execution
- **Caching**: Automatic caching of parsed routes and templates
- **URL Parameter Extraction**: Extract and match URL segments with regex support

## Installation

```bash
composer require anshu-krishna/page-server
```

**Requirements:**
- PHP >= 8.1
- anshu-krishna/php-utilities ^2.0

## Quick Start

### 1. Basic Setup

Create `public/index.php`:

```php
<?php
namespace App;

use KPS\Server;

require_once "../vendor/autoload.php";

Server::init(
    dev_mode: true,
    msg_config: new \KPS\Config\Msg(
        prettify: true,
        as_comment: true
    )
);

Server::execute();
```

### 2. Define Routes

Create a route file (e.g., `src/routes/_root_.route`):

```
`home.php` -> {
    `blog` : @`blog.route`,
    $user = `/[_a-z0-9]+/i` : `user.php` -> {
        `profile` : `user_profile.php`
    },
}
```

### 3. Create Views

Create a view file (e.g., `src/views/home.php`):

```php
<!DOCTYPE html>
<html>
<head>
    <title>Home</title>
</head>
<body>
    [[ `common/header.php` ]]
    <h1>Welcome to Home Page</h1>
</body>
</html>
```

## Core Concepts

### Routes

Routes map URL paths to views and extract URL parameters. Route files use a declarative syntax based on pattern matching.

#### Route Types

- **View Route**: `view.php` - Maps URL to a view file
- **None Route**: `none` - No view at this level, but nested routes are available (results in 404 for unmatched paths)
- **Imported Route**: `@route_file.route` - Import route definitions from another file
- **Nested Route**: `view.php -> { nested_routes }` - Define child routes accessible after current path

#### Pattern Syntax

Patterns define how URL segments are matched:

- **Literal Strings**: `` `home` `` - Match exact URL segment
- **Regex Patterns**: `/[a-z0-9]+/i` - Match using regex (flags optional)
- **Variable Capture**: `$varname = pattern` - Capture matched segment into `$_VAL['varname']`
- **Alternatives**: `(`pattern1`|`pattern2`|...)` - Match one of several options
- **Sequences**: `[pattern1, pattern2, ...]` - Match consecutive URL segments as a sequence

In sequences, you can include literal strings (`` `literal` ``) which are exact matches, and patterns can be combined with alternatives.

#### Route Definition Format

```
match1 : view1.php -> { nested1, nested2, ... },
match2 : view2.php,
match3 : none -> { nested1, nested2, ... }
```

Each route item consists of:
1. **Match Pattern** (optional for root view)
2. Colon (`:`) 
3. **View** (`view.php` or `none` or `@import.route`)
4. **Arrow and nested routes** (optional) (`-> { ... }`)

#### Examples

**Basic Structure:**
```
`home.php` -> {
    `about` : `about.php`,
    `contact` : `contact.php`
}
```

This matches:
- `/` → `home.php`
- `/about` → `about.php`
- `/contact` → `contact.php`

---

**With Variables:**
```
`home.php` -> {
    $user = `/[_a-z0-9]+/i` : `user.php` -> {
        `profile` : `user_profile.php`,
        `settings` : `user_settings.php`
    }
}
```

This matches:
- `/` → `home.php`
- `/john_doe` → `user.php` with `$_VAL['user'] = 'john_doe'`
- `/john_doe/profile` → `user_profile.php` with `$_VAL['user'] = 'john_doe'`
- `/john_doe/settings` → `user_settings.php` with `$_VAL['user'] = 'john_doe'`

---

**With Sequences:**
```
none -> {
    [
        $year = `/\d{4}/`,
        `-`,
        $month = `/\d{2}/`,
        `-`,
        $day = `/\d{2}/`
    ] : `blog_date.php`
}
```

This matches dates like `/2024-01-15` and captures:
- `$_VAL['year'] = '2024'`
- `$_VAL['month'] = '01'`
- `$_VAL['day'] = '15'`

---

**With Alternatives:**
```
`blog.php` -> {
    [
        $year = `/\d{4}/`,
        `-`,
        $month = (`/\d{2}/` | `jan` | `feb` | `mar` | `apr` | `may` | `jun` | `jul` | `aug` | `sep` | `oct` | `nov` | `dec`),
        `-`,
        $day = `/\d{2}/`
    ] : `blog_date.php`
}
```

This matches both `/2024-01-15` and `/2024-jan-15`, capturing the month value as-is.

---

**With Multiple Options:**
```
`home.php` -> {
    (`xyz` | `zyx`) : `xyz.php` -> {
        `pqr` : `pqr.php`,
        `rst` : `rst.php`
    },
    `about` : `about.php`
}
```

This matches:
- `/xyz` → `xyz.php`
- `/zyx` → `xyz.php`
- `/xyz/pqr` → `pqr.php`
- `/xyz/rst` → `rst.php`
- `/zyx/pqr` → `pqr.php`
- `/zyx/rst` → `rst.php`
- `/about` → `about.php`

---

**With Imported Routes:**
```
`home.php` -> {
    `blog` : @`blog.route`,
    `shop` : @`shop.route`,
    $user = `/[_a-z0-9]+/i` : `user.php`
}
```

The `blog.route` and `shop.route` files contain their own route definitions.

---

**Complex Example:**
```
`main.php` -> {
    `home` : `home.php`,
    `blog` : none -> {
        [$year = `/\d{4}/`, `-`, $month = `/\d{2}/`] : `blog_date.php`,
        $title = `/.{5}/` : `blog_title.php`
    },
    $user = `/[_a-z0-9]+/i` : `user.php` -> {
        `profile` : `user_profile.php`
    }
}
```

### Views

Views are PHP files that render HTML with access to URL parameters and query data.

**Available Variables in Views:**
- `$_URL` - Array of URL path segments
- `$_QUERY` - Array of GET, POST, and JSON query parameters
- `$_VAL` - Custom data store
- `$_SERVER_CFG` - Server configuration object

### Template Syntax

The template engine processes special syntax within view files to include other views and display dynamic values.

#### File Inclusion Syntax

Include other view files with automatic parsing and variable substitution:

- **Parse & Include**: `[[ `file.php` ]]` - Include file and parse template syntax
  - Relative paths use `./`: `[[ `./common/header.php` ]]`
  - Displayed content is HTML-escaped

- **Escape & Include**: `[< `file.php` >]` - Include file with HTML escaping applied to the entire content
  - Used when including untrusted content

- **Raw Include**: `[- `file.txt` -]` - Include raw file content without template parsing
  - Used for code samples, text files, or content that shouldn't be parsed
  - No variable substitution or special syntax processing

**Examples:**
```php
[[ `common/header.php` ]]              <!-- Parse and include header -->
[< `user-comment.html` >]              <!-- Include with escaping -->
[- `code-sample.txt` -]                <!-- Include raw without parsing -->
```

#### Value Display Syntax

Display dynamic values from variables with different escaping modes:

- **Normal Output**: `{{ $_URL['key'] }}` - Display value with HTML escaping
  - Safe for outputting user data
  - Prevents XSS attacks

- **Unescaped Output**: `{< $_QUERY['name'] >}` - Display value without HTML escaping
  - Use only for trusted content
  - Allows HTML markup to be rendered

- **Debug Output**: `{? $_VAL['key'] ?}` - Display value in debug format (dev mode only)
  - Shows variable type and structure
  - Only displayed when `dev_mode` is enabled
  - Wrapped in error/debug message formatting

**Examples:**
```php
{{ $_URL['page'] }}                    <!-- Escaped output -->
{< $trusted_html >}                    <!-- Unescaped output -->
{? $_VAL['user'] ?}                    <!-- Debug output -->
{{ $_QUERY['search'] }}                <!-- Query parameters with escaping -->
{< $content_from_db >}                 <!-- Database content (if trusted) -->
```

#### Variable Access

Access variables and their properties:

- **Simple Variable**: `$_URL` or `$_VAL`
- **Array Key**: `$_URL['page']` - Access array by string key
- **Numeric Index**: `$_VAL[0]` - Access array by numeric index
- **Nested Access**: `$_URL['data']['nested']` - Chain multiple levels
- **Mixed Access**: `$_VAL['user'][0]['name']` - Mix string keys and numeric indices

**Available Variables in Templates:**
- `$_URL` - Array of URL path segments (from routes)
- `$_QUERY` - Array of GET, POST, and JSON query parameters
- `$_VAL` - Custom data store for passing values between routes and views
- `$_SERVER_CFG` - Server configuration object

**Examples:**
```php
{{ $_URL[0] }}                         <!-- First URL segment -->
{{ $_URL['username'] }}                <!-- Captured route variable -->
{{ $_QUERY['search'] }}                <!-- Query parameter -->
{< $_VAL['html_content'] >}            <!-- Custom data -->
{{ $_QUERY['filters'][0] }}            <!-- Nested array access -->
```

#### Complete Template Example

```php
<!DOCTYPE html>
<html>
<head>
    <title>{{ $_URL['page'] }}</title>
</head>
<body>
    [[ `common/header.php` ]]
    
    <h1>Welcome, {{ $_QUERY['name'] }}!</h1>
    
    <p>
        Debug info: {? $_VAL ?}
    </p>
    
    <!-- Include trusted HTML content -->
    {< $_VAL['featured_content'] >}
    
    <!-- Include raw code sample -->
    <pre>
    [- `examples/code.txt` -]
    </pre>
    
    [[ `common/footer.php` ]]
</body>
</html>
```

#### Notes on Template Processing

- All template expressions are parsed before output
- File includes work with both absolute paths and relative paths
- Relative paths (starting with `./`) are resolved relative to the current view's directory
- The template parser is cached for performance
- Comments in PHP code (in included files) are preserved but template syntax is still processed

## Server Configuration

Initialize the server with `Server::init()`:

```php
Server::init(
    views_dir: '../src/views',      // Directory containing view files
    routes_dir: '../src/routes',    // Directory containing route files
    msg_config: null,               // Message/error formatting config
    dev_mode: false                 // Enable development mode
);
```

**Development Mode Features:**
- Detailed error messages with file paths and line numbers
- Debug output support
- Pretty-printed JSON responses

## Message Configuration

Control how error and debug messages are formatted:

```php
new \KPS\Config\Msg(
    prettify: true,      // Pretty-print output
    as_comment: true,    // Wrap in HTML comments
    use_print_r: false   // Use print_r or var_dump format
)
```

## Request Handling

The server automatically parses different request types:

### URL Path

URL paths are extracted and split into segments available via `$_URL`:

```
/blog/2024/01/15
# $_URL = ['blog', '2024', '01', '15']
```

### Query Data

Query data from GET, POST, and JSON bodies is merged into `$_QUERY`:

```php
// GET: ?name=john&age=30
// POST: form data or JSON
$_QUERY['name']  // 'john'
$_QUERY['age']   // '30'
```

### JSON Requests

JSON request bodies are automatically parsed:

```
Content-Type: application/json
Body: {"name": "john", "age": 30}
# $_QUERY merged with parsed JSON
```

## Example Project Structure

```
project/
├── public/
│   ├── index.php          # Entry point
│   └── .htaccess          # URL rewriting
├── src/
│   ├── routes/
│   │   ├── _root_.route   # Root route definitions
│   │   └── blog.route     # Nested route definitions
│   └── views/
│       ├── home.php       # Home view
│       ├── blog_date.php  # Blog view with URL params
│       └── common/
│           └── header.php # Shared components
├── vendor/
└── composer.json
```

## Apache Configuration

Use `.htaccess` to rewrite URLs:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ index.php?@_url_@=$1 [QSA,L]
</IfModule>
```

## API Reference

### Server

- `Server::init(...)` - Initialize the server
- `Server::execute()` - Process current request and render view
- `Server::echo_debug($value)` - Output debug message (dev mode only)
- `Server::echo_error($msg, $from = null)` - Output error message

### Static Properties

- `Server::$CFG` - Server configuration
- `Server::$_VALS` - Current request data (`_URL`, `_QUERY`, `_VAL`)

### View

- `View::__construct($file_name, $base_dir = null)` - Create view instance
- `View::content()` - Parse and return view content as structured array

### Route

- `Route::__construct($data)` - Create route from parsed data
- Routes are parsed from `.route` files and cached as `.json`

### Lib (Utilities)

- `Lib::html_esc($value)` - HTML escape a string
- `Lib::stringify($value)` - Convert value to string
- `Lib::resolve_path($base, $find, $base = null)` - Resolve file paths
- `Lib::resolve_val_chain($array, $keys)` - Deep array access

## Error Handling

Errors are caught and displayed based on configuration:

- **Development Mode**: Detailed error messages with stack traces
- **Production Mode**: Generic error messages

View rendering errors are caught and displayed automatically.

## Performance Tips

1. **Caching**: Routes are automatically cached as `.json` files. No action needed.
2. **Development Mode**: Disable in production for better performance.
3. **File Includes**: Use relative paths (starting with `./`) for included views.

## License

MIT License - See LICENSE file for details

## Author

Anshu Krishna - anshu.krishna5@gmail.com