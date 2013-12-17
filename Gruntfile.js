module.exports = function(grunt){

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
  });

  grunt.loadNpmTasks('grunt-ssh');

  grunt.registerTask('build', 'Build the add-on', function() {
    var done = this.async();
    grunt.util.spawn({
      cmd: 'cfx',
      args: ['xpi',
        '--update-link',
        'https://people.mozilla.com/~bwinton/snoozetabs/snoozetabs.xpi',
        '--update-url',
        'https://people.mozilla.com/~bwinton/snoozetabs/snoozetabs.update.rdf'
      ]
    }, function spawned(error, result, code) {
      grunt.log.ok(result);
      grunt.log.ok('Add-on built.');
      var commands = [
        ['copyFile', 'snoozetabs.xpi', '/Volumes/people.mozilla.com/public_html/snoozetabs/snoozetabs.xpi'],
        ['copyFile', 'snoozetabs.update.rdf', '/Volumes/people.mozilla.com/public_html/snoozetabs/snoozetabs.update.rdf']
      ];
      done();
    });
  });
};
