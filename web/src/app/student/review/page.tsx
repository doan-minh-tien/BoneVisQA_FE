'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { quizExtensionsApi, type ReviewItem, type SpacedRepetitionStats } from '@/lib/api/quiz-extensions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  BookOpen, 
  Calendar,
  TrendingUp,
  Sparkles,
  ArrowLeft,
  BrainCircuit,
  Target,
  Zap,
} from 'lucide-react';

export default function StudentReviewPage() {
  const [dueReviews, setDueReviews] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<SpacedRepetitionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentReview, setCurrentReview] = useState<ReviewItem | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reviews, statsData] = await Promise.all([
        quizExtensionsApi.getDueReviews(20),
        quizExtensionsApi.getSpacedRepetitionStats(),
      ]);
      
      setDueReviews(reviews);
      setStats(statsData);
      if (reviews.length > 0 && !currentReview) {
        setCurrentReview(reviews[0]);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (quality: number) => {
    if (!currentReview || processing) return;
    
    setProcessing(true);
    try {
      await quizExtensionsApi.submitReview(currentReview.scheduleId, quality);
      
      // Move to next review
      const remaining = dueReviews.filter(r => r.scheduleId !== currentReview.scheduleId);
      setDueReviews(remaining);
      setCurrentReview(remaining.length > 0 ? remaining[0] : null);
      setShowAnswer(false);
      
      // Refresh stats
      const newStats = await quizExtensionsApi.getSpacedRepetitionStats();
      setStats(newStats);
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleSkip = async () => {
    if (!currentReview) return;
    
    const remaining = dueReviews.filter(r => r.scheduleId !== currentReview.scheduleId);
    setDueReviews(remaining);
    setCurrentReview(remaining.length > 0 ? remaining[0] : null);
    setShowAnswer(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header title="Flashcard Review" subtitle="Spaced repetition for better retention" />
        <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!currentReview) {
    return (
      <div className="min-h-screen">
        <Header title="Flashcard Review" subtitle="Spaced repetition for better retention" />
        <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
          {/* Stats Overview when no reviews */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-destructive">{stats.overdue ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-warning">{stats.dueToday ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Due Today</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-primary">{stats.dueTomorrow ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Due Tomorrow</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-success">{stats.mastered ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Mastered</p>
                </CardContent>
              </Card>
            </div>
          )}
          
          <Card>
            <CardContent className="py-16 text-center">
              <div className="rounded-full bg-success/10 p-6 w-fit mx-auto mb-6">
                <CheckCircle className="h-16 w-16 text-success" />
              </div>
              <h2 className="text-2xl font-bold mb-2">All caught up!</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                You have no reviews due. Keep practicing quizzes to build your flashcard deck and strengthen your knowledge.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button asChild size="lg" className="bg-gradient-to-r from-primary to-[#007BFF]">
                  <Link href="/student/quizzes?tab=practice">Practice Quiz</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/student/dashboard">Back to Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="bg-muted/30">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">How Spaced Repetition Works</p>
                  <p className="text-muted-foreground">
                    Review cards at increasing intervals to optimize long-term memory retention.
                    Cards you find difficult will appear more often until mastered.
                    Your performance on flashcards directly influences when you&apos;ll see them again.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Flashcard Review" subtitle="Spaced repetition for better retention" />
      
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link 
            href="/student/dashboard" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <Link 
            href="/student/quizzes?tab=practice" 
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-[#007BFF] px-4 py-2 text-sm font-medium text-white hover:opacity-95"
          >
            <Target className="h-4 w-4" />
            Practice Quiz
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-destructive">{stats?.overdue ?? 0}</p>
              <p className="text-sm text-muted-foreground">Overdue</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-warning">{stats?.dueToday ?? 0}</p>
              <p className="text-sm text-muted-foreground">Due Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-primary">{stats?.dueTomorrow ?? 0}</p>
              <p className="text-sm text-muted-foreground">Due Tomorrow</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-success">{stats?.mastered ?? 0}</p>
              <p className="text-sm text-muted-foreground">Mastered</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {dueReviews.length} cards remaining
          </span>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Session Progress</span>
            <Progress 
              value={((20 - dueReviews.length) / 20) * 100} 
              className="w-32"
            />
          </div>
        </div>

        {/* Current Review Card */}
        <Card className="border-primary/50 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Flashcard Review
              </CardTitle>
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                {currentReview.repetitionCount}x reviewed
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Case/Quiz Info */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span>{currentReview.caseTitle}</span>
            </div>

            {/* Question */}
            <div className="p-6 rounded-lg bg-muted/50">
              <p className="text-lg font-medium leading-relaxed">
                {currentReview.questionText}
              </p>
            </div>

            {/* Answer (hidden by default) */}
            {showAnswer && currentReview.correctAnswer && (
              <div className="p-6 rounded-lg bg-success/10 border border-success/20 animate-in fade-in slide-in-from-top-2">
                <p className="text-lg font-medium text-success mb-2">Correct Answer:</p>
                <p className="text-lg">{currentReview.correctAnswer}</p>
              </div>
            )}

            {/* Actions */}
            {!showAnswer ? (
              <Button 
                onClick={() => setShowAnswer(true)} 
                className="w-full"
                size="lg"
              >
                Show Answer
              </Button>
            ) : (
              <div className="space-y-4">
                <p className="text-center text-sm font-medium text-muted-foreground">
                  How well did you know this?
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant="destructive"
                    size="lg"
                    onClick={() => handleReview(0)}
                    disabled={processing}
                    className="h-auto py-4"
                  >
                    <XCircle className="h-5 w-5 mb-1" />
                    <span>Again</span>
                    <span className="text-xs opacity-70 block">Complete blackout</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleReview(3)}
                    disabled={processing}
                    className="h-auto py-4"
                  >
                    <TrendingUp className="h-5 w-5 mb-1" />
                    <span>Hard</span>
                    <span className="text-xs opacity-70 block">Recalled with difficulty</span>
                  </Button>
                  <Button
                    variant="default"
                    size="lg"
                    onClick={() => handleReview(4)}
                    disabled={processing}
                    className="h-auto py-4 bg-success hover:bg-success/90"
                  >
                    <CheckCircle className="h-5 w-5 mb-1" />
                    <span>Good</span>
                    <span className="text-xs opacity-70 block">Recalled correctly</span>
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    className="flex-1"
                  >
                    Skip for now
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="bg-muted/30">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Spaced Repetition Tip</p>
                <p className="text-muted-foreground">
                  Review cards at increasing intervals to optimize long-term memory retention.
                  Cards you find difficult will appear more often until mastered.
                  Try to answer before revealing the answer to strengthen your memory.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/student/quizzes?tab=practice">
              <Target className="h-4 w-4 mr-2" />
              Take Practice Quiz
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/student/quizzes?tab=history">
              <BrainCircuit className="h-4 w-4 mr-2" />
              View Quiz History
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
