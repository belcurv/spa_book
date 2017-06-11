/* spa.js
   Root namespace module
*/

/* jshint esversion:6 */
/* globals jQuery */

var spa = (function ($) {
    
    'use strict';
    
    function initModule($container) {
        
        spa.data.initModule();  // must init before model and shell
        spa.model.initModule();
        spa.shell.initModule( $container );
        
    }
    
    return {
        initModule: initModule
    };
    
}(jQuery));
