/* spa.js
   Root namespace module
*/

/* jshint esversion:6 */
/* globals jQuery */

var spa = (function ($) {
    
    'use strict';
    
    var initModule = function ($container) {
        
        spa.shell.initModule( $container );
        
    };
    
    return {
        initModule: initModule
    };
    
}(jQuery));
