<?php
$query = new WP_Query([
    'post_type'      => 'post',      // oder ein eigener post_type
    'posts_per_page' => 10,          // Anzahl der angezeigten Beiträge
]);

if ($query->have_posts()) :
    while ($query->have_posts()) : $query->the_post(); ?>
        <article>
            <h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
            <div class="excerpt">
                <?php the_excerpt(); ?>
            </div>
        </article>
    <?php endwhile;
else :
    echo '<p>Keine Beiträge gefunden.</p>';
endif;

wp_reset_postdata();
