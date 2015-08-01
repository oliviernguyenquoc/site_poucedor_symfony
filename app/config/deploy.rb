set :application, "Pouce d'Or"
set :domain,      "campus-ecn.fr"
set :deploy_to,   "dev.poucedor.campus-ecn.fr"
set :app_path,    "app"

set :repository,  "file:///Users/NguyenQuoc/Desktop/Symfony/site_poucedor_symfony"
set :scm,         :git
set :deploy_via,    :copy
# Or: `accurev`, `bzr`, `cvs`, `darcs`, `subversion`, `mercurial`, `perforce`, or `none`

set :model_manager, "doctrine"
# Or: `propel`

role :web,        domain                         # Your HTTP server, Apache/etc
role :app,        domain, :primary => true       # This may be the same as your `Web` server

set  :keep_releases,  3

# Be more verbose by uncommenting the following line
# logger.level = Logger::MAX_LEVEL