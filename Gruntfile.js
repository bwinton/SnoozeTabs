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
      grunt.log.ok('Add-on built, copying files…');
      if (!grunt.file.exists('/Volumes/People/public_html/snoozetabs')) {
        grunt.log.error('Missing Directory!');
        done(false);
        return;
      }

      grunt.file.copy('snoozetabs.xpi',
                      '/Volumes/People/public_html/snoozetabs/snoozetabs.xpi',
                      {"encoding": null});
      grunt.log.ok('Copied XPI…');
      grunt.file.copy('snoozetabs.update.rdf',
                      '/Volumes/People/public_html/snoozetabs/snoozetabs.update.rdf',
                      {"encoding": null});
      grunt.log.ok('Copied update.rdf…');
      done();
    });
  });
};
