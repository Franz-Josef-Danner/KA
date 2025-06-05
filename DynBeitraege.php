# General
.DS_Store
*.tmp

# Caches
wp-content/cache/
diff --git a/DynBeitraege.php b/DynBeitraege.php
index f0bf2806d57111ded2a0b8e93b0d1e6afa5fbd50..6c6efeb5aa0851d04d0be11161a6e83c8fbbf109 100644
b/DynBeitraege.php
@@ -1,20 +1,24 @@
 <?php
 $query = new WP_Query([
    'post_type'      => 'post',
    'posts_per_page' => 12,
 ]);
 
 if ($query->have_posts()) :
    echo '<div class="post-grid">';
     while ($query->have_posts()) : $query->the_post(); ?>
        <article class="post-item">
            <?php if (has_post_thumbnail()) : ?>
                <a href="<?php the_permalink(); ?>">
                    <?php the_post_thumbnail('medium'); ?>
                </a>
            <?php endif; ?>
             <h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
         </article>
     <?php endwhile;
    echo '</div>';
 else :
     echo '<p>Keine Beiträge gefunden.</p>';
 endif;
 
 wp_reset_postdata();
diff --git a/README.md b/README.md
new file mode 100644
index 0000000000000000000000000000000000000000..913ec32583c7e39690224ce9e6e98dec7448b58a
+++ b/README.md
@@ -0,0 +1,15 @@
# MacroTool Configuration

This repository stores configuration and sample code for a MacroTool workflow.

## Contents

 `micromacro.setting` – configuration file defining tools and parameters used with MacroTool 1.
 `DynBeitraege.php` – example snippet for WordPress to display posts dynamically in a four-column grid with featured images.
## Usage

1. **MacroTool**: Import `micromacro.setting` into the MacroTool application to load the prepared macro setup.
2. **WordPress Example**: Place `DynBeitraege.php` in your theme or plugin and adjust the query as needed. It outputs posts with their featured images in a grid layout.

Prerequisites include a working WordPress environment and the MacroTool software for the settings file.
 
EOF
)
