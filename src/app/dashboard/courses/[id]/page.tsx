
'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useLiveQuery } from 'dexie-react-hooks';
import { CheckCircle, Clock, FileText, Bot, Loader2, Sparkles, Send, PlusCircle, CheckCircle2, XCircle, MessageSquare, Book, File, Video, Link as LinkIcon, FilePenLine, AlertTriangle, Pencil, Rocket, EyeOff, Archive } from 'lucide-react';
import QRCode from 'qrcode';
import { cn } from '@/lib/utils';
import { GenerateTestQuestionsOutput } from '@/ai/flows/generate-test-questions';
import { personalizedFeedback } from '@/ai/flows/feedback-personalization';
import { generateTestQuestions } from '@/ai/flows/generate-test-questions';
import { courseTutor } from '@/ai/flows/course-tutor';
import { summarizeModuleContent } from '@/ai/flows/summarize-module-content';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth';
import * as db from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { CertificateTemplate } from '@/components/certificate-template';
import { Forum } from '@/components/forum';
import type { Course, ResourceType } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


function TestGenerator({ courseTitle, courseContent, studentName }: { courseTitle: string; courseContent: string; studentName: string }) {
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState<GenerateTestQuestionsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const handleGenerateTest = async () => {
    setLoading(true);
    setError(null);
    setTestData(null);
    setFeedback('');
    // Reset test state
    setIsSubmitted(false);
    setScore(null);
    setAnswers({});
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

  const handleAnswerChange = (qIndex: number, value: string) => {
    setAnswers(prev => ({ ...prev, [qIndex]: value }));
  };

  const handleSubmitTest = () => {
    if (!testData) return;

    const correctCount = testData.questions.reduce((acc, question, index) => {
      return answers[index] === question.correctAnswer ? acc + 1 : acc;
    }, 0);

    setScore((correctCount / testData.questions.length) * 100);
    setIsSubmitted(true);
  };

  const handleGetFeedback = async () => {
    if (!testData || score === null) return;
    setFeedbackLoading(true);
    setFeedback('');
    try {
      const questionsForFeedback = testData.questions.map((q, i) => ({
        question: q.question,
        studentAnswer: answers[i] || 'No contestada',
        correctAnswer: q.correctAnswer,
      }));

      const result = await personalizedFeedback({
        studentName: studentName,
        assignmentName: `Test de ${courseTitle}`,
        score: score,
        questions: questionsForFeedback,
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
        {!testData && !loading && (
          <div className="flex justify-center">
            <Button onClick={handleGenerateTest} disabled={loading} size="lg">
              <Sparkles className="mr-2 h-4 w-4" />
              Generar Test
            </Button>
          </div>
        )}
        {loading && <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}
        {error && <p className="text-center text-destructive">{error}</p>}
        {testData && (
          <div className="space-y-6">
            {isSubmitted && score !== null && (
              <Card className="bg-muted/50 text-center">
                <CardHeader>
                  <CardTitle>Resultado: {score.toFixed(0)}%</CardTitle>
                </CardHeader>
              </Card>
            )}
            {testData.questions.map((q, i) => {
                const isCorrect = answers[i] === q.correctAnswer;
                return (
                    <div key={i}>
                        <div className="flex items-start gap-2 font-semibold mb-2">
                             {isSubmitted && (isCorrect ? <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" /> : <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />)}
                            <p>{i + 1}. {q.question}</p>
                        </div>
                        <RadioGroup onValueChange={(value) => handleAnswerChange(i, value)} disabled={isSubmitted} value={answers[i]}>
                            {q.options.map((opt, j) => {
                                const isSelected = answers[i] === opt;
                                const isTheCorrectAnswer = opt === q.correctAnswer;
                                return (
                                    <div key={j} className="flex items-center space-x-2">
                                        <RadioGroupItem value={opt} id={`q${i}o${j}`} />
                                        <Label htmlFor={`q${i}o${j}`} className={cn(
                                            isSubmitted && isTheCorrectAnswer && "text-green-600 font-bold",
                                            isSubmitted && isSelected && !isTheCorrectAnswer && "text-destructive line-through",
                                        )}>{opt}</Label>
                                    </div>
                                );
                            })}
                        </RadioGroup>
                        {isSubmitted && !isCorrect && (
                            <p className="text-sm text-muted-foreground mt-2">Respuesta correcta: <span className="font-semibold">{q.correctAnswer}</span></p>
                        )}
                    </div>
                );
            })}
            
            {!isSubmitted ? (
                <Button onClick={handleSubmitTest} disabled={Object.keys(answers).length !== testData.questions.length}>
                    Enviar Respuestas
                </Button>
            ) : (
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleGenerateTest} disabled={loading}>
                         <Sparkles className="mr-2 h-4 w-4" />
                         Intentar de Nuevo
                    </Button>
                    <Button variant="outline" onClick={handleGetFeedback} disabled={feedbackLoading}>
                        {feedbackLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                        Obtener Feedback
                    </Button>
                </div>
            )}
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

const resourceTypeIcons: Record<ResourceType, React.ElementType> = {
  pdf: File,
  document: File,
  link: LinkIcon,
  video: Video,
};

function CourseResources({ courseId }: { courseId: string }) {
    const resources = useLiveQuery(() => db.getResourcesForCourse(courseId), [courseId]);

    if (resources === undefined) {
        return <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    if (resources.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                <Book className="mx-auto h-12 w-12" />
                <p className="mt-4">No hay recursos disponibles para este curso.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-3">
            {resources.map(resource => {
                const Icon = resourceTypeIcons[resource.type];
                return (
                    <a 
                        key={resource.id} 
                        href={resource.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        download={resource.type !== 'link' ? resource.name : undefined}
                        className="flex items-center gap-4 p-4 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
                    >
                        <Icon className="h-6 w-6 text-primary" />
                        <div className="flex-grow">
                            <h3 className="font-semibold">{resource.name}</h3>
                            <p className="text-sm text-muted-foreground capitalize">{resource.type}</p>
                        </div>
                    </a>
                )
            })}
        </div>
    )
}

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const courseId = params.id;
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loadingCourse, setLoadingCourse] = useState(true);

  const [isDownloading, setIsDownloading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isCheckingEnrollment, setIsCheckingEnrollment] = useState(true);

  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [summaryLoading, setSummaryLoading] = useState<Record<string, boolean>>({});

  const fetchCourse = useCallback(async () => {
        setLoadingCourse(true);
        const courseData = await db.getCourseById(courseId);
        if (courseData) {
            setCourse(courseData);
        }
        setLoadingCourse(false);
    }, [courseId]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);
  
  const userProgress = useLiveQuery(
    () => (user ? db.getUserProgress(user.id, courseId) : undefined),
    [user?.id, courseId]
  );
  
  const completedModules = useMemo(() => new Set(userProgress?.completedModules || []), [userProgress]);
  const progressPercentage = useMemo(() => {
    if (!course || course.modules.length === 0) return 0;
    return Math.round((completedModules.size / course.modules.length) * 100);
  }, [course, completedModules]);
  
  useEffect(() => {
    if (!user) return;
    const checkEnrollment = async () => {
        setIsCheckingEnrollment(true);
        const enrolledCourses = await db.getEnrolledCoursesForUser(user.id);
        const enrolled = enrolledCourses.some(c => c.id === courseId);
        setIsEnrolled(enrolled);
        setIsCheckingEnrollment(false);
    }
    checkEnrollment();
  }, [user, courseId]);

  useEffect(() => {
    if (user && course) {
        const verificationUrl = `${window.location.origin}/dashboard/courses/${course.id}?userId=${user.id}`;
        QRCode.toDataURL(verificationUrl, { errorCorrectionLevel: 'H' })
            .then(url => {
                setQrCodeDataUrl(url);
            })
            .catch(err => {
                console.error('Failed to generate QR code', err);
            });
    }
  }, [user, course]);


  if (loadingCourse) {
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin" />
        </div>
    );
  }

  if (!course) {
    notFound();
  }
  
  const canManage = user && (user.role === 'Administrador General' || user.role === 'Jefe de Formación' || user.role === 'Formador');
  const canAccessForum = canManage || isEnrolled;
  const isMandatory = user && course.mandatoryForRoles?.includes(user.role);


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

  const handleMarkModuleAsCompleted = async (moduleId: string) => {
    if (!user) return;
    await db.markModuleAsCompleted(user.id, course.id, moduleId);
    // The useLiveQuery hook will automatically update the UI
  };
  
  const handleTogglePublishStatus = async () => {
    if (!canManage) return;

    setIsPublishing(true);
    const newStatus = course.status === 'draft' ? 'published' : 'draft';
    try {
        await db.updateCourseStatus(course.id, newStatus);
        toast({
            title: `Curso ${newStatus === 'published' ? 'publicado' : 'ocultado'}`,
            description: `El curso ahora es ${newStatus === 'published' ? 'visible para los usuarios' : 'un borrador'}.`,
        });
        await fetchCourse(); // Re-fetch course data to update UI
    } catch (error) {
        console.error(`Failed to ${newStatus} course`, error);
        toast({ title: "Error", description: "No se pudo actualizar el estado del curso.", variant: "destructive" });
    } finally {
        setIsPublishing(false);
    }
  }

  const handleDownloadCertificate = async () => {
      if (!certificateRef.current || !user) return;
      
      setIsDownloading(true);
      try {
          const canvas = await html2canvas(certificateRef.current, {
              scale: 2, // Higher scale for better quality
              useCORS: true,
              backgroundColor: null,
          });
          const imgData = canvas.toDataURL('image/png');
          
          const pdf = new jsPDF({
              orientation: 'landscape',
              unit: 'px',
              format: [canvas.width, canvas.height]
          });
          
          pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
          pdf.save(`Certificado - ${course.title}.pdf`);

      } catch (error) {
          console.error("Error generating certificate", error);
          toast({
              title: "Error",
              description: "No se pudo generar el certificado.",
              variant: "destructive",
          })
      } finally {
          setIsDownloading(false);
      }
  }

  const handleScormExport = () => {
    toast({
        title: "Exportación a SCORM",
        description: "Esta funcionalidad está en desarrollo y estará disponible próximamente.",
    });
  };

  const handleGenerateSummary = async (moduleId: string, content: string) => {
    setSummaryLoading(prev => ({ ...prev, [moduleId]: true }));
    try {
      const result = await summarizeModuleContent(content);
      setSummaries(prev => ({ ...prev, [moduleId]: result.summary }));
    } catch (e) {
      console.error("Failed to generate summary", e);
      toast({
        title: "Error de IA",
        description: "No se pudo generar el resumen del módulo.",
        variant: "destructive"
      });
    } finally {
      setSummaryLoading(prev => ({ ...prev, [moduleId]: false }));
    }
  };


  return (
    <div className="space-y-8">
      {/* Hidden component for PDF generation */}
      <div className="absolute -z-10 -left-[9999px] top-0">
          {user && (
            <CertificateTemplate 
                ref={certificateRef}
                userName={user.name}
                courseName={course.title}
                completionDate={format(new Date(), 'dd/MM/yyyy')}
                instructorName={course.instructor}
                qrCodeDataUrl={qrCodeDataUrl}
            />
          )}
      </div>

       {canManage && course.status === 'draft' && (
            <Alert variant="destructive" className="bg-yellow-50 border-yellow-300 text-yellow-800">
                <Pencil className="h-4 w-4 !text-yellow-800" />
                <AlertTitle>Modo Borrador</AlertTitle>
                <AlertDescription>
                    Este curso es un borrador y no es visible para los usuarios normales. Publícalo para que esté disponible en el catálogo.
                </AlertDescription>
            </Alert>
        )}

      <header className="relative h-64 w-full rounded-lg overflow-hidden">
        <Image src={course.image} alt={course.title} layout="fill" objectFit="cover" className="brightness-50" data-ai-hint={course.aiHint} />
        <div className="absolute inset-0 flex flex-col justify-end p-8 bg-gradient-to-t from-black/70 to-transparent">
          <div className="flex items-center gap-2">
            <Badge className="w-fit mb-2">{course.modality}</Badge>
            {isMandatory && <Badge variant="destructive" className="w-fit mb-2"><AlertTriangle className="h-3 w-3 mr-1.5" />Obligatorio</Badge>}
          </div>
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
              <TabsTrigger value="resources">Recursos</TabsTrigger>
              <TabsTrigger value="test">Test IA</TabsTrigger>
              <TabsTrigger value="chat">Tutor IA</TabsTrigger>
              <TabsTrigger value="forum">Foro</TabsTrigger>
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
                <CardContent>
                  {course.modules.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full space-y-2">
                      {course.modules.map((module) => {
                        const isCompleted = completedModules.has(module.id);
                        const isLoadingSummary = summaryLoading[module.id];
                        const summaryText = summaries[module.id];
                        return (
                          <AccordionItem value={module.id} key={module.id} className={cn("border rounded-lg", isCompleted && "bg-green-50 border-green-200")}>
                            <AccordionTrigger className="hover:no-underline p-4 w-full text-left">
                              <div className="flex items-center gap-4 flex-grow">
                                <CheckCircle className={cn("h-6 w-6 text-muted-foreground transition-colors", isCompleted && "text-green-500")} />
                                <div>
                                  <h3 className={cn("font-semibold", isCompleted && "line-through text-muted-foreground")}>{module.title}</h3>
                                  <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Clock className="h-4 w-4" />{module.duration}</p>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4 px-4 pb-4">
                              <div className="pl-10"> {/* Aligns with title */}
                                <p className="text-muted-foreground whitespace-pre-wrap mb-4">{module.content}</p>

                                {summaryText ? (
                                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                                    <h4 className="font-semibold text-primary flex items-center gap-2"><Bot /> Resumen IA</h4>
                                    <p className="text-sm text-blue-900 whitespace-pre-wrap">{summaryText}</p>
                                  </div>
                                ) : (
                                  <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleGenerateSummary(module.id, module.content)}
                                      disabled={isLoadingSummary || !isEnrolled}
                                      title={!isEnrolled ? "Debes estar inscrito para usar la IA" : ""}
                                  >
                                      {isLoadingSummary ? (
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      ) : (
                                          <Sparkles className="mr-2 h-4 w-4" />
                                      )}
                                      Generar Resumen
                                  </Button>
                                )}
                                
                                <div className="flex justify-end mt-4">
                                  <Button 
                                      variant={isCompleted ? "link" : "default"}
                                      size="sm"
                                      className={cn(isCompleted && "text-green-600 font-semibold")}
                                      onClick={() => handleMarkModuleAsCompleted(module.id)}
                                      disabled={isCompleted || !isEnrolled}
                                  >
                                      {isCompleted ? "✓ Completado" : "Marcar como completado"}
                                  </Button>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">Este curso todavía no tiene módulos definidos.</p>
                  )}
                  {!isEnrolled && user && course.modules.length > 0 && (
                      <div className="text-center text-sm text-amber-600 bg-amber-50 p-3 rounded-lg mt-4">
                          Debes estar inscrito para marcar tu progreso y usar las funciones de IA.
                      </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
             <TabsContent value="resources" className="mt-4">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Recursos de Apoyo</CardTitle>
                  <CardDescription>Materiales de estudio y enlaces de interés para el curso.</CardDescription>
                </CardHeader>
                <CardContent>
                   <CourseResources courseId={courseId} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="test" className="mt-4">
              <TestGenerator courseTitle={course.title} courseContent={course.longDescription} studentName={user?.name || 'Estudiante'} />
            </TabsContent>
            <TabsContent value="chat" className="mt-4">
              <CourseChat courseTitle={course.title} courseContent={course.longDescription} />
            </TabsContent>
            <TabsContent value="forum" className="mt-4">
              {isCheckingEnrollment ? (
                  <div className="flex justify-center items-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
              ) : canAccessForum && user ? (
                  <Forum courseId={course.id} user={user} canManage={!!canManage} />
              ) : (
                  <Card className="shadow-lg">
                      <CardContent className="p-8 text-center">
                          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                          <h3 className="mt-4 text-lg font-semibold">Acceso al Foro</h3>
                          <p className="mt-1 text-muted-foreground">Debes estar inscrito en este curso para ver y participar en las discusiones.</p>
                          {!isEnrolled && (
                            <Button className="mt-6" onClick={handleEnrollmentRequest}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Solicitar Inscripción
                            </Button>
                          )}
                      </CardContent>
                  </Card>
              )}
          </TabsContent>
          </Tabs>
        </div>
        <div className="space-y-8 lg:col-span-1">
           {!isEnrolled && (
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
           )}
          <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Tu Progreso</CardTitle>
            </CardHeader>
            <CardContent>
                <Progress value={progressPercentage} className="h-3" />
                <p className="text-center mt-2 text-sm text-muted-foreground">{progressPercentage}% completado</p>
            </CardContent>
            <CardFooter>
              <Button 
                  className="w-full" 
                  disabled={progressPercentage < 100 || isDownloading}
                  onClick={handleDownloadCertificate}
                >
                {isDownloading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <FileText className="mr-2 h-4 w-4" />
                )}
                {isDownloading ? 'Generando...' : 'Descargar Certificado'}
              </Button>
            </CardFooter>
          </Card>
          {canManage && (
              <Card>
                <CardHeader>
                    <CardTitle>Acciones de Gestión</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Button asChild className="w-full">
                        <Link href={`/dashboard/courses/${course.id}/edit`}>
                            <FilePenLine className="mr-2 h-4 w-4" />
                            Editar Curso y Contenido
                        </Link>
                    </Button>
                    <Button
                        variant={course.status === 'draft' ? 'default' : 'secondary'}
                        className="w-full"
                        onClick={handleTogglePublishStatus}
                        disabled={isPublishing}
                    >
                        {isPublishing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : course.status === 'draft' ? (
                            <Rocket className="mr-2 h-4 w-4" />
                        ) : (
                            <EyeOff className="mr-2 h-4 w-4" />
                        )}
                        {course.status === 'draft' ? 'Publicar Curso' : 'Ocular Curso'}
                    </Button>
                    <Button variant="outline" className="w-full" onClick={handleScormExport}>
                        <Archive className="mr-2 h-4 w-4" />
                        Exportar a SCORM
                    </Button>
                </CardContent>
              </Card>
          )}
        </div>
      </div>
    </div>
  );
}
