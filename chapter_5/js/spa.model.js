/* spa.model.js
   Model module
*/

/* jshint esversion:6 */
/* globals console, TAFFY, jQuery, spa */

spa.model = (function ($) {
    
    'use strict';
    
    /* =============================== SETUP =============================== */
    
    var configMap = {
            anon_id : 'a0'
        },
        
        stateMap = {
            anon_user      : null,    // reserve for anon person object
            cid_serial     : 0,       // serial# used to create a client ID
            people_cid_map : {},      // reserve for obj of persons keyed by ID
            people_db      : TAFFY(), // init empty TaffyDB people collection
            user           : null,    // the current users 'person' object
            is_connected   : false    // is user connected to chat room
        },
        
        isFakeData = true,  // use our Fake module instead of real server/db
        
        personProto, makeCid, clearPeopleDb, completeLogin, makePerson,
        removePerson, people, chat, initModule;
    
    
    /* ========================= PEOPLE OBJECT API =========================
    
       The people object is available at: spa.model.people.
       The people object provides methods and events to manage a collection
       of person objects. Its public methods include:
         * get_user() - return the current user person object.
           If the current user is not signed-in, an anonymous person object
           is returned.
         * get_db() - return the TaffyDB database of all ther person objects,
           including the current user, presorted.
         * get_by_cid(<client_id>) - return a person object with the provided
           unique id.
         * login(<user_name>) - login as the user with the provided user name.
           The current user object is changed to reflect the new identity.
           Successful completion of login publishes a 'spa-login' global custom
           event.
         * logout() - revert the current user objec to anonymous. Method
           publishes a 'spa-logout' global custom event.
        
       jQuery global custom events published by the object include:
         * spa-login - this is published when a user login process completes.
           The updated user object is provided as data.
         * spa-logout - this is published when a logout completes. The former
           user object is provided as data.
           
       Each person is represented by a person object.
       Person objects provide the following methods:
         * get_is_user() - returns true if the object is the current user
         * get_is_anon() - returns true if the object is anonymous
         
       The attributes for a person object include:
         * cid - string client id. This is always defined, and is only
           different from the 'id' attribute if the client data is not synced
           with the backend.
         * id - the unique id. This may be undefined if the object is not
           synced with the backend.
         * name - the string name of the user.
         * css_map - a map of attributes used for avatar presentation.
    */
    
    // prototype for 'person' objects
    personProto = {
        get_is_user : function() {
            return this.cid === stateMap.user.cid;
        },
        get_is_anon : function() {
            return this.cid === stateMap.anon_user.cid;
        }        
    };
    
    
    /* generate client ID
       Usually a person object's client ID is the same as the server ID.
       But those created on the client and not yet saved to the backend
       don’t yet have a server ID
    */    
    makeCid = function () {
        return 'c' + String(stateMap.cid_serial += 1 );
    };
    
    
    /* remove all person objects except for the anon person and any
       currently signed-in user object
    */
    clearPeopleDb = function () {
        var user = stateMap.user;
        stateMap.people_db      = TAFFY();
        stateMap.people_cid_map = {};
        if (user) {
            stateMap.people_db.insert(user);
            stateMap.people_cid_map[user.cid] = user;
        }
    };
    
    
    /* complete user sign-in when the backend sends confirmation and data
       for the user. Updates the current user information and then publishes
       the success of the sign-in using a 'spa-login' event.
    */
    completeLogin = function (user_list) {
        var user_map = user_list[0];
        delete stateMap.people_cid_map[user_map.cid];
        stateMap.user.cid     = user_map._id;
        stateMap.user_id      = user_map._id;
        stateMap.user.css_map = user_map.css_map;
        stateMap.people_cid_map[user_map._id] = stateMap.user;
        
        // When we add chat, we should join here
        $.gevent.publish('spa-login', [stateMap.user]);
    };
    
    
    // creates a 'person' object & stores it in a TaffyDB collection
    makePerson = function (person_map) {
        var person,
            cid     = person_map.cid,
            css_map = person_map.css_map,
            id      = person_map.id,
            name    = person_map.name;
        
        if (cid === undefined || !name) {
            throw 'client id and name required';
        }
        
        // create our object from prototype, then add instance-specific props
        person         = Object.create(personProto);
        person.cid     = cid;
        person.name    = name;
        person.css_map = css_map;
        
        if (id) { person.id = id; }
        
        stateMap.people_cid_map[cid] = person;
        
        stateMap.people_db.insert(person);
        return person;
    };

    
    // removes a person object from the people list
    removePerson = function (person) {
        
        // preflight check
        if (!person) {return false; }
        
        // don't return the anonymous person!
        if (person.id === configMap.anon_id) { return false; }
        
        // remove person frm database
        stateMap.people_db({ cid: person.cid }).remove();
        
        // remove them from stateMap's CID list
        if (person.cid) {
            delete stateMap.people_cid_map[ person.cid ];
        }
        
        return true;        
        
    };
    
    
    
    // define the people closure - allows us to share only the methods we want
    people = (function () {
        
        function get_by_cid(cid) {
            return stateMap.people_cid_map[cid];
        }
        
        // return the TaffyDb collection of person objects
        function get_db() {
            return stateMap.people_db;
        }
        
        // returns current user person object
        function get_user() {
            return stateMap.user;
        }
        
        // nothing fancy 
        function login(name) {
            
            // socket.io connection
            var sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();
            
            stateMap.user = makePerson({
                cid     : makeCid(),
                css_map : {top : 25, left : 25, 'background-color' : '#8f8'},
                name    : name
            });
            
            // register a callback to complete sign-in when backend publishes a
            // 'userupdate' message
            sio.on('userupdate', completeLogin);
            
            // send a 'adduser' message to backend along with user details.
            // Adding a user and signing in are the same thing in this context.
            sio.emit( 'adduser', {
                cid     : stateMap.user.cid,
                css_map : stateMap.user.css_map,
                name    : stateMap.user.name
            });
        }
        
        
        // publishes a 'spa-logout' event
        function logout() {
            var is_removed,
                user = stateMap.user;
            
            // when we add chat, we should leave the chatroom here
            
            is_removed    = removePerson(user);
            stateMap.user = stateMap.anon_user;
            
            $.gevent.publish('spa-logout', [user]);
            
            return is_removed;
        }
        
        return {
            get_by_cid : get_by_cid,
            get_db     : get_db,
            get_user   : get_user,
            login      : login,
            logout     : logout
        };
        
    }());
    
    
    /* ========================= CHAT OBJECT API =========================
    
       The chat object is available at: spa.model.chat
       The chat object provides methods and events to manage chat messaging.
       It's public methods include:
        * join() - joins the chat room. THis sets up the chat protocol with
          the backend including publishers for 'spa-listchange' and
          'spa-updatechat' global custom events. If the current user is anon,
          join() aborts and returns false.
        * get_chatee() - return the person object with whom the user is
          chatting. If there is no chatee, null us returned.
        * set_chatee(<person_id>) - set the chatee to the person identified
          by person_id. If the person_id does not exist in the people list,
          the chatee is set to null. If the person requested is already the
          chatee, it returns false. It publishes a 'spa-setchatee' global
          custom event.
        * send_msg(<msg_text>) - send a message to the chatee. It publishes
          a 'spa-updatechat' global custom event. If the user is anonymous
          or the chatee is null, it aborts and returns false.
        * update_avatar(<update_avtr_map>) - send the update_avtr_map to the
          backend. This results in a 'spa-listchange' event which publishes
          the updated people list and avatar information (the css_map in the
          person objects). The update_avtr_map must have the form:
            { person_id : person_id, css_map : css_map }.
            
       jQuery global custom events published by the object include:
        * spa-setchatee - This is published when a new chatee is set. A map
          of the form:
            {
              old_chatee : <old_chatee_person_object>,
              new_chatee : <new_chatee_person_object>
            }
          is provided as data.
        * spa-listchange - This is published when the list of online people
          changes in length (ie. when a person joins or leaves a chat) or
          when their contents change (ie, when a person's avatar details
          change). A subscriber to this event should get the people_db from the people model for the updated data.
        * spa-updatechat - This is published when a new message is received or sent.
          A map of the form:
            {
              dest_id   : <chatee_id>,
              dest_name : <chatee_name>,
              sender_id : <sender_id>,
              msg_text  : <message_content>
            }
          is provided as data.
    */
    chat = (function () {
        
        // refresh the people object when a new people list is receives
        function _update_list(arg_list) {
            var i,
                person_map,
                people_list = arg_list[0];
            
            clearPeopleDb();
            
            PERSON:
            for (i = 0; i < people_list.length; i += 1) {
                person_map = people_list[i];
                
                if (!person_map.name) {continue PERSON; }
                
                // if user defined, update css_map and skip remainder
                if (stateMap.user && stateMap.user.id === person_map._id) {
                    stateMap.user.css_map = person_map.css_map;
                    continue PERSON;
                }
                
                makePerson({
                    cid     : person_map._id,
                    css_map : person_map.css_map,
                    id      : person_map._id,
                    name    : person_map.name
                });
            }
            
            stateMap.people_db.sort('name');
        }
        
        
        // publish 'spa-listchange' event whenever a 'listchange' message
        // is received from the backend
        function _publish_listchange(arg_list) {
            _update_list(arg_list);
            $.gevent.publish('spa-listchange', [arg_list]);
        }
        
        
        // sends 'leavechat' message to backend & cleans up state variables
        function _leave_chat() {
            var sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();
            stateMap.is_connected = false;
            if ( sio ) { sio.emit( 'leavechat' ); }
        }
        
        
        // joins user to chat room after checking if user has already joined\
        function join_chat() {
            var sio;
            
            if (stateMap.is_connected) { return false; }
            
            if (stateMap.user.get_is_anon()) {
                console.warn('User must be defined before joining chat');
                return false;
            }
            
            sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();
            sio.on('listchange', _publish_listchange);
            stateMap.is_connected = true;
            return true;
        }
        
        
        // export public chat methods
        return {
            _leave : _leave_chat,
            join   : join_chat
        };
        
    }());
    
    
    
    /* ========================== PUBLIC METHODS =========================== */
    
    /* initialize module
     *
    */
    initModule = function () {
        
        // init anon person
        stateMap.anon_user = makePerson({
            cid  : configMap.anon_id,
            id   : configMap.anon_id,
            name : 'anonymous'
        });
        stateMap.user = stateMap.anon_user;
    
    };
    
    /* ====================== EXPORT PUBLIC METHODS ======================== */
    
    return {
        people     : people,
        chat       : chat,
        initModule : initModule
    };

}(jQuery));
