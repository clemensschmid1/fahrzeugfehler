-- Create function to auto-generate slug if not provided for questions2 table

CREATE OR REPLACE FUNCTION generate_questions2_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $BODY$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        base_slug := lower(regexp_replace(
            regexp_replace(
                regexp_replace(COALESCE(NEW.question, ''), '[^a-zA-Z0-9\s-]', '', 'g'),
                '\s+', '-', 'g'
            ),
            '-+', '-', 'g'
        ));
        
        base_slug := trim(both '-' from base_slug);
        
        IF length(base_slug) > 100 THEN
            base_slug := left(base_slug, 100);
        END IF;
        
        IF base_slug = '' OR base_slug IS NULL THEN
            base_slug := 'question-' || substr(md5(random()::text), 1, 8);
        END IF;
        
        final_slug := base_slug;
        WHILE EXISTS (SELECT 1 FROM questions2 WHERE slug = final_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
            counter := counter + 1;
            final_slug := base_slug || '-' || counter;
            IF counter > 1000 THEN
                final_slug := base_slug || '-' || substr(md5(random()::text), 1, 8);
                EXIT;
            END IF;
        END LOOP;
        
        NEW.slug := final_slug;
    END IF;
    RETURN NEW;
END;
$BODY$;

-- Create trigger to auto-generate slug
DROP TRIGGER IF EXISTS trigger_generate_questions2_slug ON questions2;
CREATE TRIGGER trigger_generate_questions2_slug
    BEFORE INSERT ON questions2
    FOR EACH ROW
    EXECUTE FUNCTION generate_questions2_slug();


