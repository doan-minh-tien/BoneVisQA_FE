'use client';

import { useState } from 'react';
import { StudentAppChrome } from '@/components/student/StudentAppChrome';
import Link from 'next/link';
import {
  Hand,
  Footprints,
  Bone,
  ArrowLeft,
  Search,
} from 'lucide-react';

const topicCategories = [
  {
    category: 'Upper Extremity',
    topics: [
      { id: 'shoulder', label: 'Shoulder', description: 'Glenohumeral, acromioclavicular joints' },
      { id: 'elbow', label: 'Elbow', description: 'Humeroulnar, radioulnar joints' },
      { id: 'wrist', label: 'Wrist', description: 'Radiocarpal, distal radioulnar joints' },
      { id: 'hand', label: 'Hand & Fingers', description: 'Carpals, metacarpals, phalanges' },
    ],
  },
  {
    category: 'Lower Extremity',
    topics: [
      { id: 'hip', label: 'Hip', description: 'Acetabulum, femoral head & neck' },
      { id: 'knee', label: 'Knee', description: 'Patellofemoral, tibiofemoral joints' },
      { id: 'ankle', label: 'Ankle', description: 'Talocrural, subtalar joints' },
      { id: 'foot', label: 'Foot & Toes', description: 'Tarsals, metatarsals, phalanges' },
    ],
  },
  {
    category: 'Axial Skeleton',
    topics: [
      { id: 'cervical-spine', label: 'Cervical Spine', description: 'C1-C7 vertebrae, intervertebral discs' },
      { id: 'thoracic-spine', label: 'Thoracic Spine', description: 'T1-T12 vertebrae, costovertebral joints' },
      { id: 'lumbar-spine', label: 'Lumbar Spine', description: 'L1-L5 vertebrae, sacroiliac joints' },
      { id: 'pelvis', label: 'Pelvis', description: 'Ilium, ischium, pubis, sacrum' },
    ],
  },
  {
    category: 'Other',
    topics: [
      { id: 'skull', label: 'Skull & Facial Bones', description: 'Cranium, mandible, maxilla' },
      { id: 'ribs', label: 'Ribs & Sternum', description: 'Rib cage, costal cartilage, sternum' },
      { id: 'long-bones', label: 'Long Bone Fractures', description: 'Femur, tibia, humerus, radius, ulna' },
      { id: 'bone-tumors', label: 'Bone Tumors', description: 'Benign & malignant bone neoplasms' },
    ],
  },
];

const categoryIcons: Record<string, typeof Bone> = {
  'Upper Extremity': Hand,
  'Lower Extremity': Footprints,
  'Axial Skeleton': Bone,
  'Other': Bone,
};

export default function TopicSelectionPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = topicCategories.map((cat) => ({
    ...cat,
    topics: cat.topics.filter(
      (t) =>
        t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((cat) => cat.topics.length > 0);

  return (
    <div className="min-h-screen">
      <StudentAppChrome title="Q&A by Topic" subtitle="Select a bone or joint topic to start chatting" />

      <div className="p-6 max-w-4xl mx-auto">
        {/* Back + Search */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/student/qa"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-card border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Topic Categories */}
        <div className="space-y-8">
          {filteredCategories.map((cat) => {
            const CatIcon = categoryIcons[cat.category] || Bone;
            return (
              <div key={cat.category}>
                <div className="flex items-center gap-2 mb-3">
                  <CatIcon className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-card-foreground">{cat.category}</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cat.topics.map((topic) => (
                    <Link
                      key={topic.id}
                      href={`/student/qa/topic/${topic.id}`}
                      className="bg-card rounded-lg border border-border px-5 py-4 hover:border-primary/40 hover:shadow-sm transition-all duration-150 group"
                    >
                      <p className="font-medium text-card-foreground group-hover:text-primary transition-colors">
                        {topic.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{topic.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}

          {filteredCategories.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">No topics found</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
