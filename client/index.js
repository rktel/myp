import Vue from 'vue'
import VueTracker from 'vue-meteor-tracker'
import Vuetify from 'vuetify'

import App from '/imports/ui/App.vue'
import 'vuetify/dist/vuetify.min.css'

Vue.use(VueTracker)
Vue.use(Vuetify)

Meteor.startup(() => {
    new Vue({
        render: h => h(App),
    }).$mount('app')
})
