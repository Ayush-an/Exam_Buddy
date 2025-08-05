"# userAPI"
"# Exam_Buddy"

Back end -> Server port Number is 3000, http://localhost:3000

Front end -> Server port numbwer is 5000, http://localhost:5000/

storage -> Mongodb localhost:27017

Mongodb -> Exam_buddy-> admins -> moderator, question-paper-setter.
                        examattempts -> userId, category, sections, set, examAttemptId, score, totalQuestions, correctAnswers, duration, answer.
                        questionpapers -> category, sections.
                        questions -> category, sections, set, section, questionText, questionImage, questionAudio, options, correctAnswer, marks.
                        sections -> name, isPaid, hasTimeLimit, description
                        user -> firstName, lastName, mobile, email, dob, password, score, papersAttempted, packagePurchased, planSubscription, examHistory, profileImage, subscriptions, isActive, createdAt, updatedAt, whatsapp.

backend file structure->    |
                            |---config -->db.js
                            |
                            |---controller -->examAttempt.controller.js, question.controller.js, submitExamResults.js, user.controller.js
                            |
                            |---middleware -->upload.js
                            |
                            |---models -->admin.model.js, ExamAttempt.js, question.model.js, user.model.js
                            |
                            |---node_modules
                            |
                            |---routes -->admin.router.js, examAttempt,routers.js, question.router.js, user.router.js
                            |
                            |---services -->question.services.js, user.services.js
                            |
                            |---uploads
                            |
                            |--.env
                            |
                            |--app.js
                            |
                            |--index.js

frontend file structure->   |
                            |--node_modules
                            |
                            |--public
                            |
                            |--src --> pages     ->
                                                    |
                                                assets
                                                    |
                                                components-> Profile.jsx, Settings.jsx, Subscription.jsx, Support.jsx.
                                                    |
                                                AnswerPage.jsx (This is Home Page)
                                                    |
                                                AuthPage.jsx
                                                    |
                                                PaperSetPage.jsx
                                                    |
                                                Question.jsx
                                                    |
                                                SignIn.jsx (Admin)
                                                    |
                                                SignUp.jsx (Admin)
                                                    |
                                                UserSignIn.jsx (User)
                                                    |
                                                UserSihnUp.jsx(User)
                                                    |
                                                ViewAnswer.jsx
                                                    |
                                                wellcome.jsx
                                    |
                                    |---App.css
                                    |
                                    |---App.js
                                    |
                                    |---App.test.js
                                    |
                                    |---index.css
                                    |
                                    |---reportWebVitals.js
                                    |
                                    |---setupTests.js
                            |
                            |---.babelrc
                            |
                            |---.env
                            |
                            |---postcss.config
                            |
                            |---tailwind.config
                            |
                            |---yarn.lock

Back-End : Node.js and Express.js is user and Authentation & Token for each user. For Password Safty user Hass Code and Binary code security


Front-End: Rect Native, Express.js, Tailwind css, Lottie , Animation



1st page is http://localhost:5000/auth -> this page include user sign in and also user sign up then it will go in
 ->    http://localhost:5000/exam  this is second page (main page)


 for profile->http://localhost:5000/profile

 for subscription -> http://localhost:5000/subscription

 for settings-> http://localhost:5000/settings

 for support -> http://localhost:5000/support

 this is complite in another way just like a normal anthorpy websocket and another way is web


 mongodb+srv://mohiteteena:Teena321!@cluster1.tfzss.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1

 mongodb+srv://mohiteteena:Teena321!@cluster1.tfzss.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1

 mongodb+srv://agrawalayushgopal:123@exambuddy.pddrksf.mongodb.net/?retryWrites=true&w=majority&appName=ExamBuddy