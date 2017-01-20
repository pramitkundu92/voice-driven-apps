module.exports = function(grunt){
    grunt.initConfig({
        express: {
            dev: {
                options: {
                    script: 'app/server.js'
                }
            }
        },
        watch: {
            express: {
                files: ['app/server.js','app/index.html'],
                tasks: ['express'],
                options: {
                    interrupt: true,
                    spawn: false
                }
            }
        }
    });
    
    grunt.loadNpmTasks('grunt-express-server');
    grunt.loadNpmTasks('grunt-contrib-watch');
    
    grunt.registerTask('start',['express','watch']);
};