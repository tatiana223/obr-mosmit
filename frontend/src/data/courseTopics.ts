export type CourseTopicBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'list'; ordered?: boolean; items: string[] }
  | { type: 'html'; html: string }

export type CourseTopic = {
  slug: string
  title: string
  description: string
  cover?: string
  body: CourseTopicBlock[]
}
