import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const frenchSms = "Bonjour%20Babbal%2C%20j%E2%80%99ai%20besoin%20d%E2%80%99aide%20mobile.%0A%0ALieu%20s%C3%BBr%20ou%20lien%20de%20localisation%20%3A%0AAnn%C3%A9e%2C%20marque%20et%20mod%C3%A8le%20du%20v%C3%A9hicule%20%3A%0ACe%20qui%20s%E2%80%99est%20pass%C3%A9%20%3A%0ARemorquage%20n%C3%A9cessaire%20%3A%20Oui%20%2F%20Non%20%2F%20Je%20ne%20sais%20pas";
const englishSms = "Hi%20Babbal%2C%20I%20need%20mobile%20help.%0A%0ASafe%20location%20or%20location%20pin%3A%0AVehicle%20year%2C%20make%20and%20model%3A%0AWhat%20happened%3A%0ATowing%20needed%3A%20Yes%20%2F%20No%20%2F%20Not%20sure";

const commonTranslations = [
  ["Babbal Auto Repair home", "Accueil de Babbal Auto Repair"],
  ["Primary navigation", "Navigation principale"],
  ["Skip to main content", "Aller au contenu principal"],
  ["How it works", "Fonctionnement"],
  ["Why Babbal", "Pourquoi Babbal"],
  ["Service area", "Zone desservie"],
  ["Call 24/7", "Appeler 24 h sur 24"],
  ["Language", "Langue"],
  ["Quick contact", "Contact rapide"],
  ["Mobile service across Niagara", "Service mobile dans Niagara"],
  ["24/7 mobile roadside and maintenance help at genuinely low prices.", "Dépannage routier et entretien mobiles 24 h sur 24 à des prix vraiment bas."],
  ["Contact", "Contact"],
  ["Explore", "Explorer"],
  ["Information", "Information"],
  ["Mobile services", "Services mobiles"],
  ["Request service", "Demander un service"],
  ["Privacy", "Confidentialité"],
  ["Accessibility", "Accessibilité"],
  ["Call now", "Appeler"],
  ["Text details", "Envoyer les détails"],
  ["<span>Call</span>", "<span>Appeler</span>"],
  ["<span>Text</span>", "<span>Texto</span>"],
  ["Call (289) 931-3791", "Appeler au (289) 931-3791"],
  ["Text (289) 931-3791", "Texter au (289) 931-3791"],
  ["WhatsApp (289) 931-3791", "WhatsApp au (289) 931-3791"],
  ["WhatsApp:", "WhatsApp :"],
  ["Service is subject to location, vehicle, parts, weather, and safe working conditions.", "Le service dépend du lieu, du véhicule, des pièces, de la météo et de conditions de travail sécuritaires."],
  ["Menu", "Menu"]
];

const homeTranslations = [
  ["24/7 mobile vehicle help in Niagara | Babbal Auto Repair", "Dépannage automobile mobile 24 h sur 24 dans Niagara | Babbal Auto Repair"],
  ["Call, text, or WhatsApp Babbal Auto Repair for 24/7 mobile vehicle help across the Niagara Region at genuinely low prices.", "Appelez, textez ou écrivez à Babbal Auto Repair sur WhatsApp pour un dépannage automobile mobile 24 h sur 24 dans toute la région de Niagara, à des prix vraiment bas."],
  ["24/7 mobile roadside and vehicle maintenance help across the Niagara Region.", "Dépannage routier et entretien automobile mobiles 24 h sur 24 dans toute la région de Niagara."],
  ["Babbal Auto Repair, 24/7 mobile service", "Babbal Auto Repair, service mobile 24 h sur 24"],
  ["Mobile roadside and maintenance help across the Niagara Region, day or night.", "Dépannage routier et entretien mobiles dans toute la région de Niagara, de jour comme de nuit."],
  ["Mobile vehicle help and service images", "Images de dépannage et de services automobiles mobiles"],
  ["1 of 3, battery boosts", "1 sur 3, survoltage de batterie"],
  ["2 of 3, flat tire and wheel help", "2 sur 3, aide pour pneu crevé et roue"],
  ["3 of 3, oil and fluid maintenance", "3 sur 3, entretien de l’huile et des liquides"],
  ["Hands connecting jumper cables beneath an open car hood outdoors", "Des mains branchent des câbles de démarrage sous un capot ouvert à l’extérieur"],
  ["Hands using a wheel wrench beside a car tire outdoors", "Des mains utilisent une clé de roue près d’un pneu à l’extérieur"],
  ["A hand checking the oil level beneath an open car hood", "Une main vérifie le niveau d’huile sous un capot ouvert"],
  ["24/7 mobile vehicle help in Niagara", "Dépannage automobile mobile 24 h sur 24 dans Niagara"],
  ["Mobile vehicle help, wherever you are.", "Du dépannage automobile mobile, où que vous soyez."],
  ["Call Babbal day or night for practical help at your location across the Niagara Region,\n              with clear answers and genuinely low prices.", "Appelez Babbal de jour comme de nuit pour obtenir de l’aide pratique à votre emplacement partout dans la région de Niagara, avec des réponses claires et des prix vraiment bas."],
  ["Contact Babbal Auto Repair", "Contacter Babbal Auto Repair"],
  ["Show previous service image", "Afficher l’image de service précédente"],
  ["Choose a service image", "Choisir une image de service"],
  ["Show battery boost image", "Afficher l’image de survoltage de batterie"],
  ["Show wheel help image", "Afficher l’image d’aide pour la roue"],
  ["Show oil maintenance image", "Afficher l’image d’entretien de l’huile"],
  ["Show next service image", "Afficher l’image de service suivante"],
  [">Pause<", ">Pause<"],
  ["Why customers call Babbal", "Pourquoi les clients appellent Babbal"],
  ["Available 24/7", "Disponible 24 h sur 24"],
  ["We come to you", "Nous venons à vous"],
  ["Rated 4.9 out of 5 from 244 Google reviews. Open Google reviews.", "Note de 4,9 sur 5 selon 244 avis Google. Ouvrir les avis Google."],
  ["4.9 out of 5 from 244 reviews on Google", "4,9 sur 5 selon 244 avis sur Google"],
  ["Urgent service", "Service urgent"],
  ["Stranded right now?", "En panne maintenant?"],
  ["Calling is the fastest way to check availability.", "Appeler est le moyen le plus rapide de vérifier la disponibilité."],
  ["In a live lane or unsafe position?", "Dans une voie de circulation ou un endroit dangereux?"],
  ["Call about towing first. Babbal will inspect once the vehicle is at a safe location.", "Appelez d’abord au sujet du remorquage. Babbal fera l’inspection lorsque le véhicule sera dans un endroit sûr."],
  ["Call about towing", "Appeler pour le remorquage"],
  ["Text from a safe location", "Texter depuis un endroit sûr"],
  ["WhatsApp from a safe location", "Écrire sur WhatsApp depuis un endroit sûr"],
  ["WhatsApp details", "Envoyer les détails sur WhatsApp"],
  ["Meet Babbal", "Découvrez Babbal"],
  ["A local mechanic who comes to you", "Un mécanicien local qui vient à vous"],
  ["Babbal working beside a vehicle during a mobile service visit", "Babbal travaille près d’un véhicule pendant une visite de service mobile"],
  ["Babbal at work. Real photo supplied by Babbal.", "Babbal au travail. Photo réelle fournie par Babbal."],
  ["Babbal brings more than 10 years of hands-on automotive experience to every call. For over two years, he has worked independently across the Niagara Region, helping local drivers at home, at work, or wherever they need mobile vehicle help.", "Babbal apporte plus de 10 ans d’expérience pratique en automobile à chaque appel. Depuis plus de deux ans, il travaille à son compte dans toute la région de Niagara et aide les conducteurs à domicile, au travail ou partout où ils ont besoin d’un service automobile mobile."],
  ["He believes in honest work, clear answers, and genuinely reasonable prices. Niagara is home for Babbal, his wife, and their children. His passion for automobiles has given him experience with German, Korean, Japanese, and North American vehicles across many makes and models.", "Il croit au travail honnête, aux réponses claires et aux prix réellement raisonnables. Niagara est le foyer de Babbal, de son épouse et de leurs enfants. Sa passion pour l’automobile lui a permis d’acquérir de l’expérience avec des véhicules allemands, coréens, japonais et nord-américains de nombreuses marques et de nombreux modèles."],
  ["About Babbal", "À propos de Babbal"],
  ["10+ years", "Plus de 10 ans"],
  ["Hands-on automotive experience", "D’expérience pratique en automobile"],
  ["2+ years", "Plus de 2 ans"],
  ["Serving Niagara independently", "À son compte dans Niagara"],
  ["Many makes", "De nombreuses marques"],
  ["Vehicle experience", "D’expérience sur différents véhicules"],
  ["Read what Niagara drivers say", "Lire ce que disent les conducteurs de Niagara"],
  ["Services that come to you", "Des services qui viennent à vous"],
  ["Practical help for everyday vehicle trouble", "De l’aide pratique pour les problèmes automobiles courants"],
  ["Babbal focuses on specific roadside and maintenance jobs that can be completed safely at your location across Niagara.", "Babbal se concentre sur des travaux précis de dépannage routier et d’entretien qui peuvent être effectués en toute sécurité à votre emplacement dans Niagara."],
  ["Mobile service categories", "Catégories de services mobiles"],
  ["Roadside help", "Dépannage routier"],
  ["Help for problems that leave you stuck", "De l’aide pour les problèmes qui vous immobilisent"],
  ["Common roadside jobs handled at your location when the vehicle and conditions are suitable.", "Travaux routiers courants effectués à votre emplacement lorsque le véhicule et les conditions le permettent."],
  ["Battery boosts and replacement", "Survoltage et remplacement de batterie"],
  ["Battery-cable replacement", "Remplacement des câbles de batterie"],
  ["Flat-tire help and wheel changes", "Aide pour pneu crevé et changement de roue"],
  ["Tire repair or balancing when mobile equipment supports it", "Réparation ou équilibrage de pneu lorsque l’équipement mobile le permet"],
  ["Emergency fluid replenishment", "Ajout de liquides en urgence"],
  ["Routine maintenance", "Entretien courant"],
  ["Maintenance without the shop visit", "L’entretien sans visite à l’atelier"],
  ["Straightforward upkeep for drivers who want convenient service at home or another suitable location.", "Entretien simple pour les conducteurs qui souhaitent un service pratique à domicile ou à un autre endroit convenable."],
  ["Engine oil and filter changes", "Vidange d’huile moteur et remplacement du filtre"],
  ["Air-filter and fuel-filter replacement", "Remplacement des filtres à air et à carburant"],
  ["Spark-plug replacement", "Remplacement des bougies"],
  ["Cooling, transmission, and differential fluid changes", "Changement des liquides de refroidissement, de transmission et de différentiel"],
  ["Basic lubrication", "Lubrification de base"],
  ["Select replacements", "Remplacements sélectionnés"],
  ["Specific parts replaced at your location", "Remplacement de pièces précises à votre emplacement"],
  ["A focused list of replacement jobs that may be suitable for Babbal’s mobile setup.", "Une liste ciblée de remplacements qui peuvent convenir à l’installation mobile de Babbal."],
  ["Engine drive belts", "Courroies d’entraînement du moteur"],
  ["Radiators, cooling hoses, and thermostats", "Radiateurs, durites de refroidissement et thermostats"],
  ["Bulbs, fuses, and horns", "Ampoules, fusibles et klaxons"],
  ["Exhaust systems and auto glass", "Systèmes d’échappement et vitres automobiles"],
  ["Select shocks or springs that do not require realignment", "Certains amortisseurs ou ressorts ne nécessitant pas de réalignement"],
  ["Not sure if your job is listed?", "Vous ne savez pas si votre besoin est dans la liste?"],
  ["Call Babbal first.", "Appelez d’abord Babbal."],
  ["Service depends on the vehicle, location, parts, weather, safe working conditions, and whether the requested task fits the mobile service scope.", "Le service dépend du véhicule, du lieu, des pièces, de la météo, de conditions de travail sécuritaires et du fait que la tâche demandée convienne au service mobile."],
  ["What happens next", "Ce qui se passe ensuite"],
  ["One call starts it", "Tout commence par un appel"],
  ["Tell Babbal what is happening and where you are. The request is checked before a mobile visit is arranged.", "Dites à Babbal ce qui se passe et où vous êtes. La demande est vérifiée avant d’organiser une visite mobile."],
  ["Text Babbal", "Texter Babbal"],
  ["Share the essentials", "Donnez les renseignements essentiels"],
  ["Send your safe location or pin, vehicle year, make and model, what happened, and choose Yes, No, or Not sure for towing.", "Envoyez votre emplacement sûr ou un lien de localisation, l’année, la marque et le modèle du véhicule, ce qui s’est passé, puis choisissez Oui, Non ou Je ne sais pas pour le remorquage."],
  ["Get a clear answer", "Obtenez une réponse claire"],
  ["Babbal checks the task, parts, location, weather, and safe working conditions.", "Babbal vérifie la tâche, les pièces, le lieu, la météo et les conditions de travail sécuritaires."],
  ["Arrange the visit", "Organisez la visite"],
  ["If the job is suitable, confirm the timing and have mobile service come to your location.", "Si le travail convient, confirmez le moment et faites venir le service mobile à votre emplacement."],
  ["Clear pricing", "Tarification claire"],
  ["Know the cost before work starts", "Connaissez le coût avant le début des travaux"],
  ["Babbal explains the expected cost and gets your approval before beginning a suitable service.", "Babbal explique le coût prévu et obtient votre approbation avant de commencer un service approprié."],
  ["Minimum call-out charges", "Frais minimaux de déplacement"],
  ["Standard call-out", "Déplacement standard"],
  ["After midnight", "Après minuit"],
  ["minimum", "minimum"],
  ["Call-out and vehicle check.", "Déplacement et vérification du véhicule."],
  ["Continue with Babbal?", "Vous continuez avec Babbal?"],
  ["The applicable call-out minimum is credited toward the final service total for a suitable task.", "Les frais minimaux de déplacement applicables sont déduits du total final pour une tâche appropriée."],
  ["You approve first", "Vous approuvez d’abord"],
  ["Expected parts, labour, travel, and after-hours costs are explained before work starts. You decide whether to proceed. Expected costs are estimates, not binding final quotes.", "Les coûts prévus des pièces, de la main-d’œuvre, du déplacement et du service hors des heures normales sont expliqués avant le début des travaux. Vous décidez de continuer ou non. Les coûts prévus sont des estimations et non des devis finaux contraignants."],
  ["Pay your way", "Payez comme vous le souhaitez"],
  ["Credit, debit, cash, and Interac e-Transfer are accepted. A written or electronic receipt is available on request.", "Les cartes de crédit et de débit, l’argent comptant et le virement Interac sont acceptés. Un reçu écrit ou électronique est offert sur demande."],
  ["Across Niagara", "Partout dans Niagara"],
  ["All 12 Niagara municipalities are covered. No additional distance-based travel charge applies beyond the applicable call-out minimum. Timing is confirmed for every visit.", "Les 12 municipalités de Niagara sont desservies. Aucun frais de déplacement supplémentaire lié à la distance ne s’ajoute aux frais minimaux applicables. Le moment est confirmé pour chaque visite."],
  ["See all municipalities", "Voir les 12 municipalités"],
  ["Municipalities served", "Municipalités desservies"],
  ["Same problem within 7 days?", "Le même problème dans les 7 jours?"],
  ["Babbal can recheck it without another call-out charge. Additional parts or work still require approval. After 7 days, it is treated as a new call.", "Babbal peut le vérifier de nouveau sans autres frais de déplacement. Les pièces ou travaux supplémentaires doivent toujours être approuvés. Après 7 jours, la demande est traitée comme un nouvel appel."],
  ["Reviews on Google", "Avis sur Google"],
  ["What Niagara drivers say", "Ce que disent les conducteurs de Niagara"],
  ["Short excerpts from real customers on Babbal’s Google Business Profile. The separate work gallery below is not connected to individual reviewers.", "Courts extraits de vrais clients sur le profil d’entreprise Google de Babbal, présentés dans leur langue d’origine. La galerie de travaux ci-dessous n’est liée à aucun auteur d’avis."],
  ["Selected real Google review excerpts", "Extraits sélectionnés de vrais avis Google"],
  ["4.9 out of 5 from 244 Google reviews", "4,9 sur 5 selon 244 avis Google"],
  ["4.9 out of 5 from 244 reviews", "4,9 sur 5 selon 244 avis"],
  ["out of 5", "sur 5"],
  ["244 reviews", "244 avis"],
  ["Checked August 19, 2026", "Vérifié le 19 août 2026"],
  ["5 out of 5", "5 sur 5"],
  ["Review on Google", "Avis sur Google"],
  ["Google review slideshow controls", "Commandes du carrousel d’avis Google"],
  ["Show previous review", "Afficher les avis précédents"],
  ["Choose a review", "Choisir un avis"],
  ["Show next review", "Afficher les avis suivants"],
  ["Read all Google reviews", "Lire tous les avis Google"],
  ["Real work gallery", "Galerie de travaux réels"],
  ["A look at Babbal’s past work", "Un aperçu des travaux réalisés par Babbal"],
  ["Real photos supplied by Babbal, shown separately from customer reviews. They document past work and are not a list of currently advertised services.", "Photos réelles fournies par Babbal et présentées séparément des avis clients. Elles documentent des travaux antérieurs et ne constituent pas une liste des services actuellement annoncés."],
  ["Real work photos supplied by Babbal", "Photos de travaux réels fournies par Babbal"],
  ["Open engine bay photographed during a Babbal mobile service visit", "Compartiment moteur ouvert photographié lors d’une visite mobile de Babbal"],
  ["Blue car with its hood raised during a Babbal mobile service visit", "Voiture bleue avec le capot ouvert lors d’une visite mobile de Babbal"],
  ["Car with its hood raised and a wheel removed during a mobile service visit", "Voiture avec le capot ouvert et une roue retirée lors d’une visite mobile"],
  ["Open vehicle hood with tools visible during real work", "Capot ouvert avec des outils visibles pendant de vrais travaux"],
  ["Open engine bay photographed during real work", "Compartiment moteur ouvert photographié pendant de vrais travaux"],
  ["Vehicle engine compartment photographed during real work", "Compartiment moteur d’un véhicule photographié pendant de vrais travaux"],
  ["Supplied by Babbal", "Fourni par Babbal"],
  ["These photos are not connected to the customer reviews above.", "Ces photos ne sont pas liées aux avis clients ci-dessus."],
  ["Photo 1 of 6", "Photo 1 sur 6"],
  ["Real photos, kept in their own place", "Des photos réelles, présentées séparément"],
  ["The gallery shows work Babbal has documented over time. For services currently advertised on this website, use the specific", "La galerie présente des travaux documentés par Babbal au fil du temps. Pour les services actuellement annoncés sur ce site, consultez la"],
  ["mobile services list", "liste des services mobiles"],
  ["Real work photo slideshow controls", "Commandes du carrousel de photos de travaux réels"],
  ["Show previous real work photo", "Afficher la photo de travail précédente"],
  ["Choose a real work photo", "Choisir une photo de travail réelle"],
  ["Show next real work photo", "Afficher la photo de travail suivante"],
  ["Non-urgent request", "Demande non urgente"],
  ["Tell Babbal what you need", "Dites à Babbal ce dont vous avez besoin"],
  ["Share a few details and send your request directly to Babbal. He will reply by call, text, or WhatsApp.", "Donnez quelques détails et envoyez votre demande directement à Babbal. Il répondra par appel, texto ou WhatsApp."],
  ["Need help right now?", "Besoin d’aide maintenant?"],
  ["Send details by text", "Envoyer les détails par texto"],
  ["Send details by WhatsApp", "Envoyer les détails par WhatsApp"],
  ["Leave this field blank", "Laisser ce champ vide"],
  ["Name", "Nom"],
  ["Phone number", "Numéro de téléphone"],
  ["Preferred reply", "Réponse préférée"],
  [">Call<", ">Appel<"],
  [">Text<", ">Texto<"],
  ["Vehicle year, make and model", "Année, marque et modèle du véhicule"],
  ["Example: 2017 Honda Civic", "Exemple : Honda Civic 2017"],
  ["Municipality or postal code", "Municipalité ou code postal"],
  ["No full address needed", "Aucune adresse complète nécessaire"],
  ["What help do you need?", "De quelle aide avez-vous besoin?"],
  ["Briefly describe the problem or service you need", "Décrivez brièvement le problème ou le service demandé"],
  ["Spam protection", "Protection contre les pourriels"],
  ["Protected by Cloudflare Turnstile to reduce spam.", "Protégé par Cloudflare Turnstile pour réduire les pourriels."],
  ["JavaScript is needed to send this form. You can still call, text, or WhatsApp Babbal.", "JavaScript est nécessaire pour envoyer ce formulaire. Vous pouvez toujours appeler, texter ou écrire à Babbal sur WhatsApp."],
  ["Sent only to Babbal and one authorized administrator, not stored on this website, and deleted from email after 90 days. Do not include payment details or sensitive information.", "Envoyé uniquement à Babbal et à un administrateur autorisé, non stocké sur ce site et supprimé du courriel après 90 jours. N’incluez pas de renseignements de paiement ni d’information sensible."],
  ["Privacy details", "Détails sur la confidentialité"],
  ["Send service request", "Envoyer la demande de service"],
  ["Sent securely to Babbal. Replies come by call, text, or WhatsApp.", "Envoyé de façon sécurisée à Babbal. La réponse arrive par appel, texto ou WhatsApp."],
  ["Mobile. 24/7. Niagara.", "Mobile. 24 h sur 24. Niagara."],
  ["Need mobile help? Call, text, or WhatsApp Babbal.", "Besoin d’aide mobile? Appelez, textez ou écrivez à Babbal sur WhatsApp."],
  ["WhatsApp Babbal", "Écrire à Babbal sur WhatsApp"],
  ["Call Babbal", "Appeler Babbal"]
];

const privacyTranslations = [
  ["Privacy | Babbal Auto Repair", "Confidentialité | Babbal Auto Repair"],
  ["How Babbal Auto Repair collects, uses, protects, and deletes personal information submitted through this website.", "Comment Babbal Auto Repair recueille, utilise, protège et supprime les renseignements personnels transmis sur ce site."],
  ["Your information", "Vos renseignements"],
  ["Privacy at Babbal Auto Repair", "La confidentialité chez Babbal Auto Repair"],
  ["This page explains what the website collects, why it is needed, who can see it, and how long it is kept.", "Cette page explique ce que le site recueille, pourquoi ces renseignements sont nécessaires, qui peut les voir et combien de temps ils sont conservés."],
  ["Last updated August 19, 2026", "Dernière mise à jour le 19 août 2026"],
  ["Privacy page sections", "Sections de la page de confidentialité"],
  ["On this page", "Sur cette page"],
  ["What we collect", "Ce que nous recueillons"],
  ["How it is used", "Comment ces renseignements sont utilisés"],
  ["Where it goes", "Où vont les renseignements"],
  ["Retention", "Conservation"],
  ["Your choices", "Vos choix"],
  ["If you send the service-request form, it asks for your name, phone number, preferred reply method, vehicle year, make and model, municipality or postal code, and a short description of the help you need.", "Si vous envoyez le formulaire de demande de service, il demande votre nom, votre numéro de téléphone, votre mode de réponse préféré, l’année, la marque et le modèle du véhicule, votre municipalité ou code postal et une courte description de l’aide demandée."],
  ["Do not send payment card details, government identification, medical information, or other sensitive information through the form.", "N’envoyez pas de renseignements de carte de paiement, de pièce d’identité gouvernementale, d’information médicale ni d’autres renseignements sensibles par le formulaire."],
  ["How the information is used", "Comment les renseignements sont utilisés"],
  ["Babbal uses the submitted details only to review your request, decide whether the mobile task may be suitable, contact you, arrange timing, and prevent misuse of the form.", "Babbal utilise les renseignements transmis uniquement pour examiner votre demande, déterminer si la tâche mobile peut convenir, vous contacter, organiser le moment du service et prévenir l’utilisation abusive du formulaire."],
  ["The website does not use advertising trackers or analytics. It does not sell customer information.", "Le site n’utilise aucun outil de suivi publicitaire ni service d’analyse. Il ne vend pas les renseignements des clients."],
  ["Where the information goes", "Où vont les renseignements"],
  ["Babbal and one administrator", "Babbal et un administrateur"],
  ["The form sends one email to", "Le formulaire envoie un courriel à"],
  ["Babbal and one authorized administrator can access these requests.", "Babbal et un administrateur autorisé peuvent accéder à ces demandes."],
  ["Cloudflare hosts and protects the website. Cloudflare Turnstile checks browser and device signals to reduce automated spam. Cloudflare states that Turnstile does not access, store, or transmit form entries or other page inputs. Read", "Cloudflare héberge et protège le site. Cloudflare Turnstile vérifie des signaux du navigateur et de l’appareil pour réduire les pourriels automatisés. Cloudflare indique que Turnstile n’accède pas aux données du formulaire ou aux autres entrées de la page, ne les stocke pas et ne les transmet pas. Consultez"],
  ["Cloudflare's Turnstile overview", "l’aperçu de Turnstile de Cloudflare"],
  ["Google provides the Gmail mailbox that receives requests. Google handles that email under its own", "Google fournit la boîte Gmail qui reçoit les demandes. Google traite ce courriel conformément à sa propre"],
  ["privacy policy", "politique de confidentialité"],
  ["These providers may process limited technical or email information in Canada and other countries where they operate.", "Ces fournisseurs peuvent traiter des renseignements techniques ou de courriel limités au Canada et dans d’autres pays où ils exercent leurs activités."],
  ["How long requests are kept", "Durée de conservation des demandes"],
  ["The website has no customer database and does not keep a separate copy of a submitted request. Request emails are deleted from the active mailbox after 90 days. Service providers may retain limited security or backup records under their own policies.", "Le site ne possède aucune base de données clients et ne conserve aucune copie distincte d’une demande transmise. Les courriels de demande sont supprimés de la boîte active après 90 jours. Les fournisseurs de services peuvent conserver des dossiers limités de sécurité ou de sauvegarde selon leurs propres politiques."],
  ["How information is protected", "Comment les renseignements sont protégés"],
  ["The live website will use HTTPS, server-side form validation, spam protection, limited mailbox access, security headers, and secrets that are kept outside the public website files. No internet or email system can be guaranteed completely secure.", "Le site public utilisera HTTPS, la validation du formulaire côté serveur, une protection contre les pourriels, un accès limité à la boîte de réception, des en-têtes de sécurité et des secrets conservés hors des fichiers publics. Aucun système Internet ou de courriel ne peut être garanti comme entièrement sécurisé."],
  ["You can call, text, or WhatsApp instead of using the website form.", "Vous pouvez appeler, texter ou utiliser WhatsApp au lieu du formulaire du site."],
  ["You can ask what personal information Babbal has about you.", "Vous pouvez demander quels renseignements personnels Babbal détient à votre sujet."],
  ["You can ask for a correction or deletion, subject to any information Babbal must keep for a valid legal or operational reason.", "Vous pouvez demander une correction ou une suppression, sous réserve des renseignements que Babbal doit conserver pour une raison juridique ou opérationnelle valable."],
  ["You can make a privacy complaint and ask for a response.", "Vous pouvez déposer une plainte concernant la confidentialité et demander une réponse."],
  ["Privacy contact", "Responsable de la confidentialité"],
  ["Call:", "Appel :"],
  ["Text:", "Texto :"],
  ["Email:", "Courriel :"]
];

const accessibilityTranslations = [
  ["Accessibility | Babbal Auto Repair", "Accessibilité | Babbal Auto Repair"],
  ["Babbal Auto Repair's website accessibility statement and contact options for accessibility feedback.", "Déclaration d’accessibilité du site de Babbal Auto Repair et moyens de transmettre des commentaires sur l’accessibilité."],
  ["Access for everyone", "Un accès pour tous"],
  ["Accessibility statement", "Déclaration d’accessibilité"],
  ["Babbal wants every customer to be able to understand the services, contact the business, and request help without unnecessary barriers.", "Babbal souhaite que chaque client puisse comprendre les services, communiquer avec l’entreprise et demander de l’aide sans obstacles inutiles."],
  ["Last updated August 19, 2026", "Dernière mise à jour le 19 août 2026"],
  ["Accessibility page sections", "Sections de la page d’accessibilité"],
  ["On this page", "Sur cette page"],
  ["Our goal", "Notre objectif"],
  ["What the site does", "Ce que fait le site"],
  ["Known limitations", "Limites connues"],
  ["Feedback", "Commentaires"],
  ["This website aims to meet Web Content Accessibility Guidelines 2.1 Level AA. Accessibility is reviewed as the content and technology change.", "Ce site vise à respecter les Règles pour l’accessibilité des contenus Web 2.1, niveau AA. L’accessibilité est réévaluée lorsque le contenu et la technologie changent."],
  ["What the website does", "Ce que fait le site"],
  ["Uses clear headings, plain language, real labels, and predictable navigation.", "Utilise des titres clairs, un langage simple, de vraies étiquettes et une navigation prévisible."],
  ["Supports keyboard navigation, visible focus, and a skip link.", "Prend en charge la navigation au clavier, un indicateur de mise au point visible et un lien d’accès direct."],
  ["Uses text alternatives for meaningful images and hides decorative images from assistive technology.", "Fournit des équivalents textuels pour les images utiles et masque les images décoratives aux technologies d’assistance."],
  ["Keeps Call, Text, and WhatsApp actions easy to reach, including on phone-width screens.", "Garde les actions d’appel, de texto et de WhatsApp faciles à atteindre, y compris sur les écrans de téléphone."],
  ["Uses strong colour contrast and does not rely on colour alone to communicate meaning.", "Utilise un contraste de couleurs élevé et ne se fie pas uniquement à la couleur pour transmettre un sens."],
  ["Stops automatic movement when reduced motion or browser data-saving mode is requested.", "Arrête le mouvement automatique lorsque la réduction des animations ou le mode d’économie de données est demandé."],
  ["Provides manual controls for every carousel.", "Fournit des commandes manuelles pour chaque carrousel."],
  ["Uses labelled form fields, clear validation, and status messages that assistive technology can announce.", "Utilise des champs de formulaire étiquetés, une validation claire et des messages d’état que les technologies d’assistance peuvent annoncer."],
  ["Google review pages, Cloudflare Turnstile, phone dialers, and messaging applications are third-party experiences. Their accessibility can vary by device and service provider.", "Les pages d’avis Google, Cloudflare Turnstile, les composeurs téléphoniques et les applications de messagerie sont des services tiers. Leur accessibilité peut varier selon l’appareil et le fournisseur."],
  ["If the website form presents a barrier, customers can call, text, WhatsApp, or email Babbal directly.", "Si le formulaire du site présente un obstacle, les clients peuvent appeler, texter, utiliser WhatsApp ou envoyer un courriel directement à Babbal."],
  ["Accessibility feedback", "Commentaires sur l’accessibilité"],
  ["Tell Babbal what page or task caused difficulty, what device or assistive technology you were using if you are comfortable sharing it, and how you would like a reply.", "Indiquez à Babbal la page ou la tâche qui a causé une difficulté, l’appareil ou la technologie d’assistance utilisés si vous êtes à l’aise de le préciser, et la façon dont vous souhaitez recevoir une réponse."],
  ["Call:", "Appel :"],
  ["Text:", "Texto :"],
  ["Email:", "Courriel :"]
];

const notFoundTranslations = [
  ["Page not found | Babbal Auto Repair", "Page introuvable | Babbal Auto Repair"],
  ["Page not found", "Page introuvable"],
  ["That page is not here.", "Cette page est introuvable."],
  ["The address may have changed. Return to the homepage, or contact Babbal if you need mobile vehicle help.", "L’adresse a peut-être changé. Retournez à l’accueil ou contactez Babbal si vous avez besoin d’aide automobile mobile."],
  ["Return home", "Retour à l’accueil"],
  ["WhatsApp Babbal", "Écrire à Babbal sur WhatsApp"],
  ["Call Babbal", "Appeler Babbal"],
  ["Mobile service across the Niagara Region.", "Service mobile dans toute la région de Niagara."]
];

function replaceTranslations(html, translations) {
  return [...commonTranslations, ...translations]
    .sort(([a], [b]) => b.length - a.length)
    .reduce((result, [english, french]) => result.replaceAll(english, french), html);
}

function localizeRoutes(html, pageName) {
  let result = html
    .replace('<html lang="en-CA">', '<html lang="fr-CA">')
    .replaceAll(`body=${englishSms}`, `body=${frenchSms}`)
    .replaceAll(`text=${englishSms}`, `text=${frenchSms}`)
    .replaceAll('src="assets/', 'src="/assets/')
    .replaceAll('href="assets/', 'href="/assets/')
    .replaceAll('href="styles.css', 'href="/styles.css')
    .replaceAll('src="script.js', 'src="/script.js')
    .replaceAll('href="site.webmanifest"', 'href="/site.webmanifest"')
    .replaceAll('href="/#', 'href="/fr/#')
    .replaceAll('href="#', 'href="/fr/#')
    .replaceAll('href="privacy.html"', 'href="/fr/privacy.html"')
    .replaceAll('href="accessibility.html"', 'href="/fr/accessibility.html"');

  const frenchPath = pageName === "index.html" ? "/fr/" : `/fr/${pageName}`;
  const englishPath = pageName === "index.html" ? "/" : `/${pageName}`;
  const frenchCanonical = `https://niagaraautorepair.com${frenchPath}`;
  result = result
    .replaceAll('"legalNom":', '"legalName":')
    .replace(/<link rel="canonical" href="[^"]+" \/>/, `<link rel="canonical" href="${frenchCanonical}" />`)
    .replace('<meta property="og:url" content="https://niagaraautorepair.com/" />', `<meta property="og:url" content="${frenchCanonical}" />`)
    .replace('<meta property="og:locale" content="en_CA" />', '<meta property="og:locale" content="fr_CA" />')
    .replace('<meta property="og:locale:alternate" content="fr_CA" />', '<meta property="og:locale:alternate" content="en_CA" />');
  const switchPattern = /<div class="language-switch" aria-label="Langue"><span aria-current="page">EN<\/span><a href="[^"]+" lang="fr">FR<\/a><\/div>/;
  result = result.replace(switchPattern, `<div class="language-switch" aria-label="Langue"><a href="${englishPath}" lang="en">EN</a><span aria-current="page">FR</span></div>`);

  if (pageName === "index.html") {
    result = result.replaceAll('href="/fr/#', 'href="/fr/#');
    result = result.replace('<a class="brand" href="/fr/#top"', '<a class="brand" href="/fr/"');
    result = result.replace('<a class="brand brand-footer" href="/fr/#top"', '<a class="brand brand-footer" href="/fr/"');
    result = result.replaceAll('content="24/7 mobile', 'content="Dépannage mobile 24 h sur 24');
    result = result.replaceAll('class="review-slide', 'lang="en" class="review-slide');
    result = result
      .replaceAll('>Reviews<', '>Avis<')
      .replace(/aria-label="(\d) of (\d)"/g, 'aria-label="$1 sur $2"')
      .replace(/Show real work photo (\d)/g, 'Afficher la photo de travail réelle $1')
      .replace('<label><input type="radio" name="reply" value="Call" checked /> Call</label>', '<label><input type="radio" name="reply" value="Call" checked /> Appel</label>')
      .replace('<label><input type="radio" name="reply" value="Text" /> Text</label>', '<label><input type="radio" name="reply" value="Text" /> Texto</label>');
  } else {
    result = result.replace('<a class="brand" href="/"', '<a class="brand" href="/fr/"');
    result = result.replace('<a class="brand brand-footer" href="/"', '<a class="brand brand-footer" href="/fr/"');
    result = result.replaceAll('href="/fr/#main-content"', `href="${frenchPath}#main-content"`);

    if (pageName === "privacy.html") {
      for (const id of ["collection", "use", "sharing", "retention", "choices", "contact"]) {
        result = result.replaceAll(`href="/fr/#${id}"`, `href="/fr/privacy.html#${id}"`);
      }
    }

    if (pageName === "accessibility.html") {
      for (const id of ["goal", "measures", "limitations", "feedback"]) {
        result = result.replaceAll(`href="/fr/#${id}"`, `href="/fr/accessibility.html#${id}"`);
      }
    }
  }

  if (pageName === "404.html") {
    result = result.replace('<a class="button button-primary" href="/"', '<a class="button button-primary" href="/fr/"');
  }

  return result;
}

export async function buildFrenchSite(projectRoot, outputDirectory) {
  const frenchDirectory = path.join(outputDirectory, "fr");
  await mkdir(frenchDirectory, { recursive: true });

  const pages = [
    ["index.html", homeTranslations],
    ["privacy.html", privacyTranslations],
    ["accessibility.html", accessibilityTranslations],
    ["404.html", notFoundTranslations]
  ];

  for (const [pageName, translations] of pages) {
    const source = await readFile(path.join(projectRoot, pageName), "utf8");
    const translated = localizeRoutes(replaceTranslations(source, translations), pageName);
    await writeFile(path.join(frenchDirectory, pageName), translated);
  }

  await cp(path.join(projectRoot, "site.webmanifest"), path.join(frenchDirectory, "site.webmanifest"));
}
