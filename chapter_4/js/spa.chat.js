/* spa.chat.js
   Chat feature module for SPA
*/

/* jshint esversion:6 */
/* globals jQuery, spa */

spa.chat = (function ($) {
    
    'use strict';
    
    /* ==================== INIT MODULE SCOPE VARIABLES ==================== */
    
    var 
    
        // static configuration values
        configMap = {
            
            // html template
            main_html: `
                <div style="padding: 1em; color: #fff;">
                    Say hello to chat    
                </div>`,
            
            settable_map: {}
        },
        
        // dynamic information shared throughout module
        stateMap = {
            $container        : null
        },
        
        // jQuery collections cache container
        jqueryMap = {};
        
    
    /* ========================== UTILITY METHODS ========================== */
        
        
    /* ============================ DOM METHODS ============================ */
    
    /* cache jQuery collections to reduce document traversals & improve perf
    */
    function setJqueryMap() {
        var $container = stateMap.$container;
        
        jqueryMap = {
            $container: $container
        };
    }
    
    
    /* ========================== EVENT HANDLERS =========================== */
    
    
    /* ========================== PUBLIC METHODS =========================== */
    
    /* configModule method adjusts configuration of allowed keys.
         Whenever a feature module accepts settings, we always use the same
         method name and the same spa.util.setConfigMap utility.
     * @params    [object]   input_map   [map of settable keys and values]
     * @returns   [boolean]              [true]
    */
    function configModule(input_map) {
        spa.util.setConfigMap({
            input_map    : input_map,
            settable_map : configMap.settable_map,
            config_map   : configMap
        });
        return true;
    }
    
    
    /* initModule method starts the module execution
     * @params    [object]   $container   [jQuery element used by this feature]
     * @returns   [boolean]               [true]
    */
    function initModule($container) {
        $container.html( configMap.main_html );  // fill chat slider with our template
        stateMap.$container = $container;
        setJqueryMap();
        return true;
    }
    
    
    /* ====================== EXPORT PUBLIC METHODS ======================== */
    
    return {
        configModule : configModule,
        initModule   : initModule
    };

}(jQuery));
