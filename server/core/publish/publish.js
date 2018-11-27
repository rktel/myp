import { Plates } from '../../../imports/api/collections'

Meteor.publish('plates', function (argument) {
    return Plates.find({})
});