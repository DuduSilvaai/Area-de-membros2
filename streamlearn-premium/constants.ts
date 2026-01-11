import { Course, LessonStatus, User, Comment, Attachment, Portal } from './types';

export const CURRENT_USER: User = {
  id: 'u1',
  name: 'Alex Miller',
  avatar: 'https://picsum.photos/seed/user1/100/100',
};

// Mozart Brand Logo
export const BRAND_LOGO = "https://cdn-icons-png.flaticon.com/512/2964/2964063.png"; // Placeholder for an abstract/artistic logo

export const MOCK_PORTALS: Portal[] = [
  {
    id: 'p1',
    name: 'Mozart Design Academy',
    logo: BRAND_LOGO,
    description: 'Master the art of digital aesthetics and user experience.',
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'
  },
  {
    id: 'p2',
    name: 'Code Symphony',
    logo: 'https://cdn-icons-png.flaticon.com/512/1005/1005141.png',
    description: 'Orchestrating complex systems with clean code.',
    coverImage: 'https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=2670&auto=format&fit=crop'
  }
];

export const MOCK_COMMENTS: Comment[] = [
  {
    id: 'c1',
    user: { id: 'u2', name: 'Sarah Jones', avatar: 'https://picsum.photos/seed/user2/100/100' },
    text: 'Great explanation on the React hooks! Really cleared up my confusion about useEffect.',
    date: '2 hours ago'
  },
  {
    id: 'c2',
    user: { id: 'u3', name: 'Instructor Mike', avatar: 'https://picsum.photos/seed/instructor/100/100' },
    text: 'Glad to hear that Sarah! Let me know if you have questions about custom hooks in the next module.',
    date: '1 hour ago',
    isInstructor: true
  }
];

export const MOCK_ATTACHMENTS: Attachment[] = [
  { id: 'a1', name: 'Course_Slides_v2.pdf', type: 'PDF', size: '2.4 MB' },
  { id: 'a2', name: 'Starter_Code.zip', type: 'ZIP', size: '15 MB' },
];

export const COURSES: Course[] = [
  {
    id: 'course-1',
    title: 'Advanced React Patterns & Performance',
    author: 'Mike Davids',
    thumbnail: 'https://picsum.photos/seed/react/800/450',
    progress: 45,
    lastLessonId: 'l-1-2',
    modules: [
      {
        id: 'm-1',
        title: 'Module 1: Rendering Fundamentals',
        lessons: [
          { id: 'l-1-1', title: 'Understanding the Virtual DOM', duration: '12:30', status: LessonStatus.COMPLETED, description: 'Deep dive into how React handles rendering updates.' },
          { id: 'l-1-2', title: 'The Reconciliation Algorithm', duration: '15:45', status: LessonStatus.IN_PROGRESS, description: 'How React diffs the tree.' },
          { id: 'l-1-3', title: 'React Fiber Explained', duration: '20:00', status: LessonStatus.AVAILABLE, description: 'Under the hood of Fiber architecture.' },
        ]
      },
      {
        id: 'm-2',
        title: 'Module 2: Hooks Deep Dive',
        lessons: [
          { id: 'l-2-1', title: 'UseEffect Pitfalls', duration: '18:20', status: LessonStatus.LOCKED, description: 'Avoid infinite loops.' },
          { id: 'l-2-2', title: 'Custom Hooks for Data Fetching', duration: '22:10', status: LessonStatus.LOCKED, description: 'Abstracting fetch logic.' },
        ]
      }
    ]
  },
  {
    id: 'course-2',
    title: 'UI/UX Design Masterclass',
    author: 'Jessica Chen',
    thumbnail: 'https://picsum.photos/seed/design/800/450',
    progress: 10,
    lastLessonId: 'l-design-1',
    modules: [
      {
        id: 'm-d-1',
        title: 'Module 1: Typography',
        lessons: [
          { id: 'l-design-1', title: 'Choosing the Right Font', duration: '08:15', status: LessonStatus.COMPLETED, description: 'Serif vs Sans-Serif.' },
          { id: 'l-design-2', title: 'Vertical Rhythm', duration: '14:00', status: LessonStatus.IN_PROGRESS, description: 'Spacing your content correctly.' },
        ]
      }
    ]
  },
  {
    id: 'course-3',
    title: 'Fullstack Next.js 14',
    author: 'Tim Neutkens',
    thumbnail: 'https://picsum.photos/seed/nextjs/800/450',
    progress: 0,
    modules: [
       {
        id: 'm-n-1',
        title: 'Introduction',
        lessons: [
          { id: 'l-n-1', title: 'Setup & Installation', duration: '05:00', status: LessonStatus.AVAILABLE, description: 'Getting started.' },
        ]
      }
    ]
  },
  {
    id: 'course-4',
    title: 'Modern CSS with Tailwind',
    author: 'Adam Wathan',
    thumbnail: 'https://picsum.photos/seed/tailwind/800/450',
    progress: 80,
    modules: [
       {
        id: 'm-t-1',
        title: 'Utility First',
        lessons: [
          { id: 'l-t-1', title: 'Why Utility Classes?', duration: '10:00', status: LessonStatus.COMPLETED, description: 'Philosophy.' },
        ]
      }
    ]
  }
];