
var express = require('express');
var fs = require('fs');
var port = process.env.PORT || "80";
var path = require('path');
var app = express();
app.get('/', function (req, res) {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Expires', '0');
  res.send(String(fs.readFileSync(path.resolve(__dirname, "./dist/index.html"))));
});
app.use(express.static('dist'));
app.listen(port, () => {
  console.log(`listen ${port} ....`)
})