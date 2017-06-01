/* spa.util.js
   General JavaScript utilities from Michael S. Mikowski (MIT License)
*/

/* jshint esversion:6 */
/* globals jQuery, spa */

spa.util = (function ($) {
    
    'use strict';
    
    /* ========================== PUBLIC METHODS =========================== */
    
    /* makeError method - convenience wrapper for creating error objects
     * @params    [string]   name_text   [the error name]
     * @params    [string]   msg_text    [long error message]
     * @params    [object]   data        [optional data attached to error object]
     * @returns   [object]               [newly constructed error object]
    */
    function makeError(name_text, msg_text, data) {
        var error     = new Error();
        error.name    = name_text;
        error.message = msg_text;
        
        if (data) { error.data = data; }
        
        return error;
    }
    
    
    /* setConfigMap method - easy and consistent way to change modules settings
     * @params    [object]   arg_map   [configuration object]
     * @returns   [boolean]            [true]
    */
    function setConfigMap(arg_map) {
        
        var input_map    = arg_map.input_map,    // map of key-values to set in config
            settable_map = arg_map.settable_map, // map of allowable keys to set
            config_map   = arg_map.config_map,   // map to apply settings to
            key_name, error;
        
        for (key_name in input_map) {
            if (input_map.hasOwnProperty(key_name)) {
                if (settable_map.hasOwnProperty(key_name)) {
                    config_map[key_name] = input_map[key_name];
                } else {
                    error = makeError(
                        'Bad Input',
                        `Setting config key "${key_name}" is not supported`
                    );
                    throw error;
                }
            }
        }
    }
    
    
    /* ====================== EXPORT PUBLIC METHODS ======================== */
    
    return {
        makeError    : makeError,
        setConfigMap : setConfigMap
    };

}(jQuery));
