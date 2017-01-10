var riot = require('riot');
var App = require('./app.js');

require('material-design-lite');

/*require('./libs/material.min.js');*/

// require tags,
require('./tags/app.tag.js');
require('./tags/datainput.tag.js');
require('./tags/datashow.tag.js');
require('./tags/tree.tag.js');
require('./tags/codeinput.tag.js');

// riot.mount('app', {app: new App()});

riot.mount('app', new App());
