function construct_url(config, env_var_name) {
  if (env_var_name && process.env[env_var_name]) {
    console.log(`Using ${env_var_name} environment variable`);
    return process.env[env_var_name];
  } // if ...

  const hostname = config.get('hostname');
  const port = config.has('port') ? config.get('port') : undefined;
  const prefix = config.has('prefix') ? config.get('prefix') : undefined;
  const secure = config.has('secure') ? config.get('secure') : undefined;

  const protocol = secure ? 'https' : 'http';
  const port_part = port ? `:${port}` : '';
  const prefix_part = prefix ? `/${prefix}` : '';

  return `${protocol}://${hostname}${port_part}${prefix_part}`;
} // construct_url

exports.construct_url = construct_url;
