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
            
            // respond to 'updatechat' event with an 'updatechat' callback
            // after 2 sec delay. Echo back user info.
            if (msg_type === 'updatechat' && callback_map.updatechat) {
                setTimeout(function () {
                    var user = spa.model.people.get_user();
                    callback_map.updatechat([{
                        dest_id   : user.id,
                        dest_name : user.name,
                        sender_id : data.dest_id,
                        msg_text  : 'Thanks for the note, ' + user.name                        
                    }]);
                }, 2000);
            }
            
            // clear the callbacks used by chat if 'leavechat' message is
            // received. This means the user has signed out.
            if (msg_type === 'leavechat') {
                // reset login status
                delete callback_map.listchange;
                delete callback_map.updatechat;
                
                if (listchange_idto) {
                    clearTimeout(listchange_idto);
                    listchange_idto = undefined;
                }
                
                send_listchange();
            }
            
            // simulate send of 'updateavatar' message and data to server
            if (msg_type === 'updateavatar' && callback_map.listchange) {
                // simulate receipt of 'listchange' message
                for (let i = 0; i < peopleList.length; i += 1) {
                    
                    // find the person object specified by the data from
                    // updateavatar message and change its css_map property
                    if (peopleList[i]._id === data.person_id) {
                        peopleList[i].css_map = data.css_map;
                        break;
                    }
                }
                
                // execute the callback registered for the listchange message
                callback_map.listchange([ peopleList ]);
            }
        }
        
        
        /* Tries to send a mock message to the signed-in user once every 8
           seconds. This will succeed only after a user is signed in when the
           'updatechat' callback is set. On success, does not call itself
           again and therefore no further attempts to send a mock message will
           be made
        */
        function emit_mock_msg() {
            setTimeout(function () {
                var user = spa.model.people.get_user();
                if (callback_map.updatechat) {
                    callback_map.updatechat([{
                        dest_id : user.id,
                        dest_name : user.name,
                        sender_id : 'id_04',
                        msg_text : `Hi there ${user.name}! I'm not Wilma.`
                    }]);
                } else {
                    emit_mock_msg();
                }
                
            }, 8000);
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
                    
                    // start trying to send a mock message after user signs in
                    emit_mock_msg();
                    
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
