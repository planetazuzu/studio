'use client';

import { useState } from 'react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { CheckCircle, Clock, FileText, Bot, Loader2, Sparkles, Send, PlusCircle } from 'lucide-react';
import { GenerateTestQuestionsOutput } from '@/ai/flows/generate-test-questions';
import { personalizedFeedback } from '@/ai/flows/feedback-personalization';
import { generateTestQuestions } from '@/ai/flows/generate-test-questions';
import { courseTutor } from '@/ai/flows/course-tutor';
import { getCourseById } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth';
import * as db from '@/lib/db';
import { useToast } from '@/hooks/use-toast';

function TestGenerator({ courseContent, studentName }: { courseContent: string; studentName: string }) {
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState<GenerateTestQuestionsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleGenerateTest = async () => {
    setLoading(true);
    setError(null);
    setTestData(null);
    setFeedback('');
    try {
      const result = await generateTestQuestions({ courseContent, numberOfQuestions: 3 });
      setTestData(result);
    } catch (e) {
      setError('No se pudo generar el test. Inténtelo de nuevo.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGetFeedback = async () => {
    if (!testData) return;
    setFeedbackLoading(true);
    setFeedback('');
    try {
      const result = await personalizedFeedback({
        studentName: studentName,
        assignmentName: 'Test de SVB',
        studentAnswer: 'Respuesta del estudiante (simulada sobre RCP)',
        correctAnswer: testData.questions[0].correctAnswer,
      });
      setFeedback(result.feedback);
    } catch (e) {
      console.error(e);
    } finally {
      setFeedbackLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Test de Autoevaluación</CardTitle>
        <CardDescription>Genera un test con IA para comprobar tus conocimientos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!testData && (
          <div className="flex justify-center">
            <Button onClick={handleGenerateTest} disabled={loading} size="lg">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generar Test
            </Button>
          </div>
        )}
        {error && <p className="text-center text-destructive">{error}</p>}
        {testData && (
          <div className="space-y-6">
            {testData.questions.map((q, i) => (
              <div key={i}>
                <p className="font-semibold mb-2">{i + 1}. {q.question}</p>
                <RadioGroup>
                  {q.options.map((opt, j) => (
                    <div key={j} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt} id={`q${i}o${j}`} />
                      <Label htmlFor={`q${i}o${j}`}>{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
            <div className="flex gap-2">
                <Button>Enviar Respuestas</Button>
                <Button variant="outline" onClick={handleGetFeedback} disabled={feedbackLoading}>
                    {feedbackLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                    Obtener Feedback
                </Button>
            </div>
            {feedback && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                    <h4 className="font-semibold text-primary flex items-center gap-2"><Bot /> Feedback Personalizado</h4>
                    <p className="text-sm text-blue-900">{feedback}</p>
                </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
}

function CourseChat({ courseTitle, courseContent }: { courseTitle: string, courseContent: string }) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage: ChatMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const result = await courseTutor({ courseContent, question: input });
            const aiMessage: ChatMessage = { sender: 'ai', text: result.answer };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = { sender: 'ai', text: 'Lo siento, no he podido procesar tu pregunta. Por favor, inténtalo de nuevo.' };
            setMessages(prev => [...prev, errorMessage]);
            console.error('Error with course tutor:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="shadow-lg h-[500px] flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bot /> Tutor de IA para "{courseTitle}"
                </CardTitle>
                <CardDescription>Haz preguntas sobre el contenido del curso.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto space-y-4 p-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                        {msg.sender === 'ai' && <Bot className="h-6 w-6 text-primary flex-shrink-0" />}
                        <div className={`flex flex-col w-full max-w-md leading-1.5 p-4 border-gray-200 ${msg.sender === 'user' ? 'bg-primary text-primary-foreground rounded-s-xl rounded-ee-xl' : 'bg-gray-100 rounded-e-xl rounded-es-xl'}`}>
                            <p className="text-sm font-normal text-current">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {loading && (
                     <div className="flex items-start gap-2.5">
                        <Bot className="h-6 w-6 text-primary flex-shrink-0" />
                        <div className="flex flex-col w-full max-w-md leading-1.5 p-4 border-gray-200 bg-gray-100 rounded-e-xl rounded-es-xl">
                            <Loader2 className="h-5 w-5 animate-spin"/>
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="p-4 pt-2 border-t">
                <form onSubmit={handleSendMessage} className="relative w-full">
                    <Input
                        placeholder="Escribe tu pregunta..."
                        className="pr-12"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                    />
                    <Button size="icon" type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" disabled={loading || !input.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
}

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const course = getCourseById(params.id);

  if (!course) {
    notFound();
  }

  const handleEnrollmentRequest = async () => {
    if (!user) return;
    try {
        await db.requestEnrollment(course.id, user.id);
        toast({
            title: "Solicitud enviada",
            description: "Tu solicitud de inscripción ha sido enviada para su aprobación.",
        });
    } catch (error) {
        console.error("Failed to request enrollment", error);
        toast({
            title: "Error",
            description: "No se pudo enviar la solicitud. Inténtalo de nuevo.",
            variant: "destructive",
        })
    }
  }

  return (
    <div className="space-y-8">
      <header className="relative h-64 w-full rounded-lg overflow-hidden">
        <Image src={course.image} alt={course.title} layout="fill" objectFit="cover" className="brightness-50" data-ai-hint={course.aiHint} />
        <div className="absolute inset-0 flex flex-col justify-end p-8 bg-gradient-to-t from-black/70 to-transparent">
          <Badge className="w-fit mb-2">{course.modality}</Badge>
          <h1 className="text-4xl font-bold text-white">{course.title}</h1>
          <p className="text-lg text-white/90">Impartido por {course.instructor}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Descripción</TabsTrigger>
              <TabsTrigger value="modules">Módulos</TabsTrigger>
              <TabsTrigger value="test">Test IA</TabsTrigger>
              <TabsTrigger value="chat">Tutor IA</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Sobre este curso</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{course.longDescription}</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="modules" className="mt-4">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Contenido del Curso</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {course.modules.map((module) => (
                    <div key={module.id} className="flex items-start gap-4 p-4 rounded-lg border">
                      <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                      <div>
                        <h3 className="font-semibold">{module.title}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Clock className="h-4 w-4" />{module.duration}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="test" className="mt-4">
              <TestGenerator courseContent={course.longDescription} studentName={user?.name || 'Estudiante'} />
            </TabsContent>
            <TabsContent value="chat" className="mt-4">
              <CourseChat courseTitle={course.title} courseContent={course.longDescription} />
            </TabsContent>
          </Tabs>
        </div>
        <div className="space-y-8 lg:col-span-1">
           <Card className="shadow-lg">
              <CardHeader>
                  <CardTitle>Inscripción</CardTitle>
              </CardHeader>
              <CardContent>
                  <Button className="w-full" onClick={handleEnrollmentRequest}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Solicitar Inscripción
                  </Button>
              </CardContent>
            </Card>
          <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Tu Progreso</CardTitle>
            </CardHeader>
            <CardContent>
                <Progress value={course.progress} className="h-3" />
                <p className="text-center mt-2 text-sm text-muted-foreground">{course.progress}% completado</p>
            </CardContent>
            <CardFooter>
              <Button className="w-full" disabled={course.progress < 100}>
                <FileText className="mr-2 h-4 w-4" />
                Descargar Certificado
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
