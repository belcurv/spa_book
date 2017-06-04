/* spa.fake.js
 * Fake module - provides mock data to our model and allows development in
   the absence of a server or feature module UI. Fake will emulate a Data
   module and a Socket.io connection to our server. We'll use the browser console to test it.
*/

/* jshint esversion:6, browser: true */
/* globals jQuery, spa */

spa.fake = (function ($) {
    
    'use strict';
    
    /* =============================== SETUP =============================== */
    
    var getPeopleList,
        fakeIdSerial,
        makeFakeId,
        mockSio;
    
    fakeIdSerial = 5;
    
    
    /* ========================== UTILITY METHODS ========================== */
    
    // mock server ID serial number counter
    makeFakeId = function () {
        return 'id_' + String( fakeIdSerial += 1 );
    };
    
    
    /* ========================== PUBLIC METHODS =========================== */
    
    /* return data for a list of fake persons
     * @params    [none]
     * @returns   [array]    [array of fake person objects]
    */
    getPeopleList = function () {
        return [
            {
                name : 'Erin',
                _id  : 'id_01',
                css_map : {
                    top: 20,
                    left: 20,
                    'background-color' : 'rgb(128,128,128)'
                }
            },
            {
                name : 'Jay',
                _id  : 'id_02',
                css_map : {
                    top: 60,
                    left: 20,
                    'background-color' : 'rgb(128,255,128)'
                }
            },
            {
                name : 'Sophia',
                _id  : 'id_03',
                css_map : {
                    top: 100,
                    left: 20,
                    'background-color' : 'rgb(128,192,192)'
                }
            },
            {
                name : 'Zenya',
                _id  : 'id_04',
                css_map : {
                    top: 140,
                    left: 20,
                    'background-color' : 'rgb(192,128,128)'
                }
            }
        ];
    };
    
    
    // mock Socket IO connection closure / object
    mockSio = (function () {
        
        var callback_map = {};
        
        // method to register a callback for a message type
        function on_sio(msg_type, callback) {
            callback_map[msg_type] = callback;
        }
        
        // method emulates sending a message to the server. When received, wait
        // 3 sec to simulate net latency before invoking updateuser callback.
        function emit_sio(msg_type, data) {
            
            // respond to 'adduser' event with 'userupdate' callback after a
            // 3 sec delay
            if (msg_type === 'adduser' && callback_map.userupdate) {
                setTimeout(function () {
                    callback_map.userupdate(
                        [{
                            _id     : makeFakeId(),
                            name    : data.name,
                            css_map : data.css_map
                        }]
                    );
                }, 3000);
            }
        }
        
        // export on_sio as 'on' and emit_sio as 'emit' to emulate real
        // SocketIO object
        return {
            emit : emit_sio,
            on   : on_sio
        };
        
    }());
    
    /* ====================== EXPORT PUBLIC METHODS ======================== */
    
    return {
        getPeopleList : getPeopleList,
        mockSio       : mockSio
    };
    
}(jQuery));
