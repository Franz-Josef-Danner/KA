 # General
 .DS_Store
 *.tmp
 
 # Caches
 wp content/cache/
 <?php
 $query = new WP_Query([
     'post_type'      => 'post',      // oder ein eigener post_type
     'posts_per_page' => 10,          // Anzahl der angezeigten Beiträge
     'post_type'      => 'post',
     'posts_per_page' => 12,
 ]);
 
 if ($query >have_posts()) :
     while ($query >have_posts()) : $query >the_post(); ?>
         <article>
 if ( $query >have_posts() ) :
     echo '<div class="post grid">';
     while ( $query >have_posts() ) : $query >the_post();
 ?>
         <article class="post item">
             <?php if ( has_post_thumbnail() ) : ?>
                 <a href="<?php the_permalink(); ?>">
                     <?php the_post_thumbnail( 'medium' ); ?>
                 </a>
             <?php endif; ?>
             <h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
             <div class="excerpt">
                 <?php the_excerpt(); ?>
             </div>
         </article>
     <?php endwhile;
 <?php
     endwhile;
     echo '</div>';
 else :
     echo '<p>Keine Beiträge gefunden.</p>';
 endif;
 
 wp_reset_postdata();
