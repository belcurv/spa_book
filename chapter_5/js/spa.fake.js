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
    
    var peopleList,
        getPeopleList,
        fakeIdSerial,
        makeFakeId,
        mockSio;
    
    fakeIdSerial = 5;
    
    // mock people list
    peopleList = [
        {
            name : 'Erin', _id  : 'id_01',
            css_map : {
                top: 20, left: 20,
                'background-color' : 'rgb(128,128,128)'
            }
        },
        {
            name : 'Jay', _id  : 'id_02',
            css_map : {
                top: 60, left: 20,
                'background-color' : 'rgb(128,255,128)'
            }
        },
        {
            name : 'Sophia', _id  : 'id_03',
            css_map : {
                top: 100, left: 20,
                'background-color' : 'rgb(128,192,192)'
            }
        },
        {
            name : 'Zenya', _id  : 'id_04',
            css_map : {
                top: 140, left: 20,
                'background-color' : 'rgb(192,128,128)'
            }
        }
    ];
    
    
    /* ========================== UTILITY METHODS ========================== */
    
    // mock server ID serial number counter
    makeFakeId = function () {
        return 'id_' + String( fakeIdSerial += 1 );
    };
    
    
    /* ========================== PUBLIC METHODS =========================== */
    
    
    // mock Socket IO connection closure / object
    mockSio = (function () {
        
        var listchange_idto,
            callback_map = {};
        
        // register a callback for a message type
        function on_sio(msg_type, callback) {
            callback_map[msg_type] = callback;
        }
        
        // emulates sending a message to the server. When received, wait
        // 3 sec to simulate net latency before invoking updateuser callback.
        function emit_sio(msg_type, data) {
            
            var person_map;
            
            // respond to 'adduser' event with 'userupdate' callback after a
            // 3 sec delay
            if (msg_type === 'adduser' && callback_map.userupdate) {
                setTimeout(function () {
                    
                    person_map = {
                        _id     : makeFakeId(),
                        name    : data.name,
                        css_map : data.css_map
                    };
                    
                    // push user definition into mock people list
                    peopleList.push(person_map);
                    
                    callback_map.userupdate([person_map]);
                }, 3000);
            }
        }
        
        
        /* Emulate the receipt of a 'listchange' message from the backend.
           Once per second, look for the 'listchange' callback (which the 
           'chat' object registers only after a user has signed in and joined
           the chat room).
           If the callback is found, it is executed using the mock
           'peopleList' as its argument, and 'send_listchange' stops polling.
        */
        function send_listchange() {
            listchange_idto = setTimeout( function () {
                if (callback_map.listchange) {
                    callback_map.listchange([peopleList]);
                    listchange_idto = undefined;
                } else {
                    send_listchange();
                }
            }, 1000);
        }
        
        // Manually start the process
        send_listchange();
        
        // export on_sio as 'on' and emit_sio as 'emit' to emulate real
        // SocketIO object
        return {
            emit : emit_sio,
            on   : on_sio
        };
        
    }());
    
    /* ====================== EXPORT PUBLIC METHODS ======================== */
    
    return {
        mockSio : mockSio
    };
    
}(jQuery));
