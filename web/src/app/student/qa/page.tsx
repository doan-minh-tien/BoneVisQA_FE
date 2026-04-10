import { StudentAppChrome } from '@/components/student/StudentAppChrome';
import Link from 'next/link';
import { BotMessageSquare, ImageUp, ArrowRight } from 'lucide-react';

const modes = [
  {
    title: 'Q&A by Topic',
    description: 'Choose a bone/joint topic and chat with AI using our medical knowledge base (RAG).',
    details: [
      'Select from categorized bone & joint topics',
      'AI answers based on curated medical documents',
      'Responses include cited references',
    ],
    icon: BotMessageSquare,
    href: '/student/qa/topic',
    iconColor: 'bg-primary/10 text-primary',
    borderColor: 'hover:border-primary/50',
  },
  {
    title: 'Q&A by Image',
    description: 'Upload an X-ray, CT, or MRI image and ask AI questions about it.',
    details: [
      'Support X-ray, CT, MRI image formats',
      'AI detects and analyzes bone lesions',
      'Get structured diagnostic suggestions',
    ],
    icon: ImageUp,
    href: '/student/qa/image',
    iconColor: 'bg-warning/10 text-warning',
    borderColor: 'hover:border-warning/50',
  },
];

export default function StudentQAPage() {
  return (
    <div className="min-h-screen">
      <StudentAppChrome breadcrumb="AI Q&A" title="AI Q&A" subtitle="Choose a mode to start asking questions" />

      <div className="p-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <Link
                key={mode.title}
                href={mode.href}
                className={`bg-card rounded-xl border border-border p-6 transition-all duration-200 hover:shadow-lg ${mode.borderColor} group`}
              >
                <div className={`w-14 h-14 rounded-xl ${mode.iconColor} flex items-center justify-center mb-4`}>
                  <Icon className="w-7 h-7" />
                </div>

                <h2 className="text-xl font-semibold text-card-foreground mb-2">{mode.title}</h2>
                <p className="text-sm text-muted-foreground mb-4">{mode.description}</p>

                <ul className="space-y-2 mb-6">
                  {mode.details.map((detail) => (
                    <li key={detail} className="flex items-start gap-2 text-sm text-card-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>

                <div className="flex items-center gap-2 text-primary font-medium text-sm group-hover:gap-3 transition-all duration-200">
                  Get started
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
