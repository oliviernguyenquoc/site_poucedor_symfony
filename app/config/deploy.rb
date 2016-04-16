set :stages, %w(preprod prod)
set :default_stage, "preprod"
set :stage_dir, "app/config"
require 'capistrano/ext/multistage'