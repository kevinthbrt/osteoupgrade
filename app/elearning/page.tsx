'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import { BookOpen, ExternalLink, Play, CheckCircle, Clock, AlertCircle, Loader2, GraduationCap } from 'lucide-react'

interface Course {
  id: string
  systemio_course_id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  course_url: string
  is_active: boolean | null
  display_order: number | null
  created_at: string
}

interface Enrollment {
  id: string
  course_id: string
  enrolled_at: string
  last_accessed_at: string | null
  progress: number | null
  completed: boolean | null
  completed_at: string | null
}

export default function ElearningPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      // Get user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)

      // Check if user has premium access
      if (profileData?.role !== 'premium_silver' && profileData?.role !== 'premium_gold' && profileData?.role !== 'admin') {
        // User doesn't have access
        setLoading(false)
        return
      }

      // Get active courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('systemio_courses')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (coursesError) {
        console.error('Error loading courses:', coursesError)
      } else {
        setCourses(coursesData || [])
      }

      // Get user enrollments
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('user_course_enrollments')
        .select('*')
        .eq('user_id', user.id)

      if (enrollmentsError) {
        console.error('Error loading enrollments:', enrollmentsError)
      } else {
        setEnrollments(enrollmentsData || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (courseId: string) => {
    if (!profile?.id) return

    setEnrollingCourseId(courseId)

    try {
      const { error } = await supabase
        .from('user_course_enrollments')
        .insert({
          user_id: profile.id,
          course_id: courseId,
          enrolled_at: new Date().toISOString(),
          progress: 0,
          completed: false
        })

      if (error) {
        console.error('Error enrolling:', error)
        alert('Erreur lors de l\'inscription à la formation')
        return
      }

      // Refresh enrollments
      const { data: enrollmentsData } = await supabase
        .from('user_course_enrollments')
        .select('*')
        .eq('user_id', profile.id)

      setEnrollments(enrollmentsData || [])
      alert('Inscription réussie !')
    } catch (error) {
      console.error('Error:', error)
      alert('Erreur lors de l\'inscription')
    } finally {
      setEnrollingCourseId(null)
    }
  }

  const handleAccessCourse = async (course: Course) => {
    const enrollment = enrollments.find(e => e.course_id === course.id)

    if (enrollment && profile?.id) {
      // Update last accessed
      await supabase
        .from('user_course_enrollments')
        .update({ last_accessed_at: new Date().toISOString() })
        .eq('id', enrollment.id)
    }

    // Open course in new tab
    window.open(course.course_url, '_blank')
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AuthLayout>
    )
  }

  const isPremium = profile?.role === 'premium_silver' || profile?.role === 'premium_gold' || profile?.role === 'admin'

  if (!isPremium) {
    return (
      <AuthLayout>
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 text-primary-600 text-sm font-semibold mb-3">
              <GraduationCap className="h-5 w-5" />
              E-learning
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Formations en ligne</h1>
            <p className="text-gray-600">
              Accédez à nos formations professionnelles hébergées sur System.io
            </p>
          </div>

          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl p-8 shadow-lg">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 text-sm font-semibold mb-4">
                <AlertCircle className="h-4 w-4" />
                Accès Premium requis
              </div>
              <h2 className="text-3xl font-bold mb-4">Passez Premium pour accéder aux formations</h2>
              <p className="text-white/90 text-lg mb-6">
                Débloquez l'accès à toutes nos formations professionnelles en ligne, le testing 3D, la topographie et bien plus encore.
              </p>
              <div className="flex flex-wrap gap-3 mb-6">
                <span className="bg-white/20 px-4 py-2 rounded-full text-sm font-semibold">Formations illimitées</span>
                <span className="bg-white/20 px-4 py-2 rounded-full text-sm font-semibold">Testing 3D</span>
                <span className="bg-white/20 px-4 py-2 rounded-full text-sm font-semibold">Topographie</span>
              </div>
              <button
                onClick={() => router.push('/settings')}
                className="bg-white text-amber-600 px-6 py-3 rounded-lg font-semibold hover:bg-white/90 transition"
              >
                Activer Premium
              </button>
            </div>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 text-primary-600 text-sm font-semibold mb-3">
            <GraduationCap className="h-5 w-5" />
            E-learning
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Formations en ligne</h1>
          <p className="text-gray-600">
            Accédez à nos formations professionnelles hébergées sur System.io
          </p>
        </div>

        {/* Info banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="bg-blue-500 rounded-full p-2">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Formations System.io</h3>
              <p className="text-sm text-gray-600">
                Toutes nos formations sont hébergées sur System.io. En cliquant sur "Accéder à la formation",
                vous serez redirigé vers la plateforme System.io pour suivre votre cours.
              </p>
            </div>
          </div>
        </div>

        {/* Courses grid */}
        {courses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <BookOpen className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune formation disponible</h3>
            <p className="text-gray-600">
              Les formations seront bientôt disponibles. Revenez plus tard !
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const enrollment = enrollments.find(e => e.course_id === course.id)
              const isEnrolled = !!enrollment
              const isEnrolling = enrollingCourseId === course.id

              return (
                <div
                  key={course.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Thumbnail */}
                  {course.thumbnail_url ? (
                    <div className="relative h-48 bg-gradient-to-br from-primary-500 to-primary-600">
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="relative h-48 bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                      <GraduationCap className="h-16 w-16 text-white/50" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg mb-2">{course.title}</h3>
                      {course.description && (
                        <p className="text-sm text-gray-600 line-clamp-3">{course.description}</p>
                      )}
                    </div>

                    {/* Enrollment info */}
                    {isEnrolled && enrollment && (
                      <div className="space-y-2">
                        {enrollment.completed ? (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="font-medium">Formation complétée</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Progression</span>
                              <span className="font-semibold text-gray-900">{enrollment.progress || 0}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary-600 h-2 rounded-full transition-all"
                                style={{ width: `${enrollment.progress || 0}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {enrollment.last_accessed_at && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>
                              Dernier accès: {new Date(enrollment.last_accessed_at).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {isEnrolled ? (
                        <button
                          onClick={() => handleAccessCourse(course)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
                        >
                          <Play className="h-4 w-4" />
                          Accéder à la formation
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEnroll(course.id)}
                          disabled={isEnrolling}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-primary-600 text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition disabled:opacity-50"
                        >
                          {isEnrolling ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Inscription...
                            </>
                          ) : (
                            <>
                              <BookOpen className="h-4 w-4" />
                              S'inscrire
                            </>
                          )}
                        </button>
                      )}
                      <a
                        href={course.course_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                        title="Ouvrir sur System.io"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* My enrollments summary */}
        {enrollments.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Mes statistiques</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500 rounded-full p-2">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{enrollments.length}</p>
                    <p className="text-sm text-gray-600">Formation{enrollments.length > 1 ? 's' : ''} inscrite{enrollments.length > 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500 rounded-full p-2">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {enrollments.filter(e => e.completed).length}
                    </p>
                    <p className="text-sm text-gray-600">Formation{enrollments.filter(e => e.completed).length > 1 ? 's' : ''} terminée{enrollments.filter(e => e.completed).length > 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-500 rounded-full p-2">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {enrollments.filter(e => !e.completed).length}
                    </p>
                    <p className="text-sm text-gray-600">En cours</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
