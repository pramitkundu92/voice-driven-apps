module.exports = function(grunt){
    grunt.initConfig({
        less: {
            development: {
                options: {
                    /*compress: true,
                    yuicompress: true,
                    optimization: 2,
                    cleancss: true*/
                },
                files: {
                    'app/styles.css': ['app/styles.less']
                }
            }
        },
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
            },
            less: {
                files: ['app/styles.less'],
                tasks: ['less'],
                options: {
                    interrupt: true,
                    spawn: false
                }
            }
        }
    });
    
    grunt.loadNpmTasks('grunt-express-server');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-less');
    
    grunt.registerTask('start',['less','express','watch']);
};