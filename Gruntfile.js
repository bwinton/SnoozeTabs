module.exports = function(grunt){

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
  });

  /* Build and deploy tasks. */

  grunt.registerTask('build', 'Build the add-on', function() {
    var done = this.async();
    grunt.file.expand('*.update.rdf').forEach(function (fn) {
      grunt.file.delete(fn);
    });
    grunt.util.spawn({
      cmd: 'jpm',
      args: ['xpi']
    }, function spawned(error, result, code) {
      grunt.file.expand('jid1-snoozetabs@jetpack-*.update.rdf').forEach(function (fn) {
        grunt.file.copy(fn, 'snoozetabs.update.rdf');
      });
      grunt.log.ok(result);
      grunt.log.ok('Add-on built.');
      done();
    });
  });

  grunt.registerTask('copy', 'Copy the files to the server.', function() {
    this.requires(['build']);

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
    grunt.file.copy('index.html',
                    '/Volumes/People/public_html/snoozetabs/index.html',
                    {"encoding": null});
    grunt.log.ok('Copied index.html…');
  });

  grunt.registerTask('deploy', 'Build the add-on and copy the files.', ['build', 'copy']);


  /* Testing tasks. */

  grunt.registerTask('run', 'Run a testing version of the add-on', function() {
    var done = this.async();
    var run = grunt.util.spawn({
      cmd: 'jpm',
      args: ['run', '-b', 'nightly', '-p', 'profile.testing']
    }, function spawned(error, result, code) {
      if (code != 0) {
        console.log(error);
      }
      done();
    });
    if (run.stderr) {
      run.stderr.on('data', function (buf) {
        grunt.log.ok(buf);
      })
    }
  });

  grunt.registerTask('test', 'Run the tests for the add-on', function() {
    var done = this.async();
    var run = grunt.util.spawn({
      cmd: 'jpm',
      args: ['test', '-b', 'nightly']
    }, function spawned(error, result, code) {
      done();
    });
    if (run.stderr) {
      run.stderr.on('data', function (buf) {
        grunt.log.ok(buf);
      })
    }
  });


};
