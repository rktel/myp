Meteor.startup(() => {
    console.log(">>>>>>>>>>>>>> Meteor Server Up");
    const platesExist = Meteor.call('arrayPlatesExist')
    if (!platesExist) {
        Meteor.call('createArrayPlates')
        Meteor.call('updatePlates')
    }

    // Meteor.call('getReport', 'T2P916', '2018-08-20 00:00', '2018-08-20 01:59')

});