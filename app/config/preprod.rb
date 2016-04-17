set :application, "poucedor"
set :domain, "poucedorxl@ftp.cluster003.ovh.net" # Le SSH de destination
# set :domain,      "poucedor.fr"
set :deploy_to, '/homez.2216/poucedorxl/www/poucedor/dev'
set :app_path,    "app"
set :user, "poucedorxl" # Le nom d’utilisateur du serveur distant

set :repository,  "git@github.com:oliviernguyenquoc/site_poucedor_symfony.git"
set :branch, "master" # La branche Git, utile si vous pushez vos releases de prod sur une branche particulière
set :scm, :git # SVN ? Haha, vous plaisantez j’espère :-)
set :deploy_via, :copy # Ils y a plusieurs méthodes de déploiements, nous utilisons la méthode de copy

set :model_manager, "doctrine" # ORM

role :web, domain
role :app, domain, :primary => true

set :use_sudo, false
set :keep_releases, 3 # Le nombre de releases à garder après un déploiement réussi

set :php_bin,     "/usr/local/php5.6/bin/php"
# set :php_bin,     "php.ORIG.5_6 -C -d magic_quotes_gpc=0 -d register_globals=0"
# set :php_bin,      "php.TEST.5"

## Symfony2
set :shared_files, ["app/config/parameters.yml"] # Les fichiers à conserver entre chaque déploiement
set :shared_children, [app_path + "/logs", "vendor", "web/images", "web/other"] # Idem, mais pour les dossiers
set :use_composer, true
# set :composer_bin, "/homez.2216/poucedorxl/composer.phar"
set :update_vendors, false # Il est conseillé de laisser a false et de ne pas faire de ‘composer update’ directement sur la prod
#set :composer_options, "--verbose --prefer-dist" # Permet de spécifier des paramètres supplémentaires à composer, inutile dans notre cas
set :writable_dirs, ["app/cache", "app/logs"] # Application des droits nécessaires en écriture sur les dossiers
set :webserver_user, "www-data" # L’utilisateur de votre serveur web (Apache, nginx, etc.)
set :permission_method, :chmod_alt # Dans le cas où vous n’avez pas les ACLs, ne pas oublier de mettre :use_sudo à true
#set :use_sudo, true
#default_run_options[:pty] = true
set :use_set_permissions, true
#set :assets_install, true
#set :dump_assetic_assets, true # dumper les assets

before "deploy:update_code", "deploy:dump_assetic_locally"
after "deploy:update_code", "deploy:rsync_local_assets_to_server"

#default_run_options[:pty] = true # Si vous avez cette erreur : no tty present and no askpass program specified, alors décommentez
#ssh_options[:forward_agent] = true # Idem que ci-dessus

# Permet d’avoir le détail des logs de capistrano, plus facile à débugger si vous rencontrer des erreurs
logger.level = Logger::MAX_LEVEL

before "deploy" do
    run "alias php='/usr/local/php5.6/bin/php'"
end

# update database schema
# you can use migrate or anything else
before "symfony:cache:warmup", "symfony:doctrine:schema:update"


namespace :deploy do
  task :dump_assetic_locally, :roles => :web do
    run_locally "php app/console assetic:dump --env=prod"
  end

  task :rsync_local_assets_to_server, :roles => :web do
    finder_options = {:except => { :no_release => true }}
    find_servers(finder_options).each {|s| run_locally "rsync -az --delete --rsh='ssh -p #{ssh_port(s)}' #{local_web_path}/js/ #{rsync_host(s)}:#{release_path}/web/js/" }
    find_servers(finder_options).each {|s| run_locally "rsync -az --delete --rsh='ssh -p #{ssh_port(s)}' #{local_web_path}/css/ #{rsync_host(s)}:#{release_path}/web/css/" }
  end

  def local_web_path
    File.expand_path("web")
  end

  def rsync_host(server)
    :user ? "#{user}@#{server.host}" : server.host
  end

  def ssh_port(server)
    server.port || ssh_options[:port] || 22
  end

end
