-- These rows are derived from schools.content. Rebuild them at startup with the
-- improved parser so numbered legacy headings cannot leak into adjacent fields.
delete from school_details;
