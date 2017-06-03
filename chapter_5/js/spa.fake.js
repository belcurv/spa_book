/* spa.fake.js
 * Fake module - provides mock data to our model and allows development in
   the absence of a server or feature module UI. Fake will emulate a Data
   module and server connection. We'll use the browser console to test it.
*/

/* jshint esversion:6 */
/* globals jQuery, spa */

spa.fake = (function ($) {
    
    'use strict';
    
    /* =============================== SETUP =============================== */
    
    
    
    /* ========================== PUBLIC METHODS =========================== */
    
    /* return data for a list of fake persons
     * @params    [none]
     * @returns   [array]    [array of fake person objects]
    */
    function getPeopleList() {
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
    }
    
    
    /* ========================== UTILITY METHODS ========================== */
    
    
    
    /* ====================== EXPORT PUBLIC METHODS ======================== */
    
    return {
        getPeopleList : getPeopleList
    };
    
}(jQuery));
