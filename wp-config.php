<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the installation.
 * You don't have to use the web site, you can copy this file to "wp-config.php"
 * and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * Database settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://wordpress.org/support/article/editing-wp-config-php/
 *
 * @package WordPress
 */

// ** Database settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'practice' );

/** Database username */
define( 'DB_USER', 'root' );

/** Database password */
define( 'DB_PASSWORD', '' );

/** Database hostname */
define( 'DB_HOST', 'localhost' );

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8mb4' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',         '/gN2{e @&o-lZL2O.-}X46`)10qB{~q%=bb`CjH`#V{4vy|#eq/YWz{lzf{LuN;T' );
define( 'SECURE_AUTH_KEY',  '4?(u 1,0,2a12n>^3(gHlw:$O<d10xp0al^Y<Yl]r%W<Uy%C}NZq}YYgUgtvrN@m' );
define( 'LOGGED_IN_KEY',    '1JFl+BANM6>$ <T:mUrQ$Gm}1n 1V0-&AQ01>0k=ed%Cd%Rmc-+z2%7k?80#O&kg' );
define( 'NONCE_KEY',        't]sj%RBn9/-k//z(!jY g6HDwkNd=fQOn<a;{Dd*#._wl%qJe{,Vq7=huyZ)?uEd' );
define( 'AUTH_SALT',        'G~,d+zUJKK95)7GHa Wa`Uo ~GcXa}.9cW^-uE FGb3ru3H=`HTKd[j=61oXd=p}' );
define( 'SECURE_AUTH_SALT', 'h=kRV8}_G za0-waDSH}=e:,x3lNM?duihw]MPA7V_JD|=ZzF7i,yp72qikm}&{{' );
define( 'LOGGED_IN_SALT',   '}Y5;$YARM?xd8ykR#[1QZ j.h|ewz<OdeM(I=ROCJ98){6i WD[W<u7gEHWj@bEq' );
define( 'NONCE_SALT',       'A?q.>jt0>r!DL1DED*i;U**!<%g|9sR3zZ|eA<a6=0!px$CVAQuCI0>eO0`1DoI3' );

/**#@-*/

/**
 * WordPress database table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix = 'wp_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://wordpress.org/support/article/debugging-in-wordpress/
 */
define( 'WP_DEBUG', false );

/* Add any custom values between this line and the "stop editing" line. */



/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
