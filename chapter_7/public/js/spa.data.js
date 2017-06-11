/* spa.data.js
 * Data module - manages all connections to the server.
 * All data communicated between client & server flows through this module.
*/

/* jshint esversion:6 */
/* globals jQuery, io, spa */

spa.data = (function ($) {
    
    'use strict';
    
    /* =============================== SETUP =============================== */
    
    var stateMap = {
        sio : null
    };
    
    
    /* ========================== PRIVATE METHODS ========================== */
    
    // create the socket connection using the /chat namspace
    function makeSio() {
        var socket = io.connect('/chat');
        
        return {
            
            // 'emit' sends data associated with a given event name to server
            emit : function (event_name, data) {
                socket.emit(event_name, data);
            },
            
            // 'on' registers a callback for a given event name. Event data
            // received from the server will be passed to the callback
            on : function(event_name, callback) {
                socket.on(event_name, function () {
                    callback(arguments);
                });
            }
            
        };
    }
    
    
    /* ========================== PUBLIC METHODS =========================== */
    
    // tries to always return a valid 'sio' object
    function getSio() {
        if (!stateMap.sio) {
            stateMap.sio = makeSio();
        }
        return stateMap.sio;
    }
    
    
    // initialization
    function initModule() {
        // doesn't do anything yet ...
    }
    
    return {
        getSio     : getSio,
        initModule : initModule
    };
    
}(jQuery));
