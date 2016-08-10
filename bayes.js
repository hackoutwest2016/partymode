var Bayes = (function (Bayes) {
    Array.prototype.unique = function () {
        var u = {}, a = [];
        for (var i = 0, l = this.length; i < l; ++i) {
            if (u.hasOwnProperty(this[i])) {
                continue;
            }
            a.push(this[i]);
            u[this[i]] = 1;
        }
        return a;
    }
    var stemKey = function (stem, label) {
        return '_Bayes::stem:' + stem + '::label:' + label;
    };
    var docCountKey = function (label) {
        return '_Bayes::docCount:' + label;
    };
    var stemCountKey = function (stem) {
        return '_Bayes::stemCount:' + stem;
    };

    var log = function (text) {
        console.log(text);
    };

    var tokenize = function (text) {
        text = text.toLowerCase().replace(/\W/g, ' ').replace(/\s+/g, ' ').trim().split(' ').unique();
        return text;
    };

    var getLabels = function () {
        var labels = localStorage.getItem('_Bayes::registeredLabels');
        if (!labels) labels = '';
        return labels.split(',').filter(function (a) {
            return a.length;
        });
    };

    var registerLabel = function (label) {
        var labels = getLabels();
        if (labels.indexOf(label) === -1) {
            labels.push(label);
            localStorage.setItem('_Bayes::registeredLabels', labels.join(','));
        }
        return true;
    };

    var stemLabelCount = function (stem, label) {
        var count = parseInt(localStorage.getItem(stemKey(stem, label)));
        if (!count) count = 0;
        return count;
    };
    var stemInverseLabelCount = function (stem, label) {
        var labels = getLabels();
        var total = 0;
        for (var i = 0, length = labels.length; i < length; i++) {
            if (labels[i] === label) 
                continue;
            total += parseInt(stemLabelCount(stem, labels[i]));
        }
        return total;
    };

    var stemTotalCount = function (stem) {
        var count = parseInt(localStorage.getItem(stemCountKey(stem)));
        if (!count) count = 0;
        return count;
    };
    var docCount = function (label) {
        var count = parseInt(localStorage.getItem(docCountKey(label)));
        if (!count) count = 0;
        return count;
    };
    var docInverseCount = function (label) {
        var labels = getLabels();
        var total = 0;
        for (var i = 0, length = labels.length; i < length; i++) {
            if (labels[i] === label) 
                continue;
            total += parseInt(docCount(labels[i]));
        }
        return total;
    };
    var increment = function (key) {
        var count = parseInt(localStorage.getItem(key));
        if (!count) count = 0;
        localStorage.setItem(key, parseInt(count) + 1);
        return count + 1;
    };

    var incrementStem = function (stem, label) {
        increment(stemCountKey(stem));
        increment(stemKey(stem, label));
    };

    var incrementDocCount = function (label) {
        return increment(docCountKey(label));
    };

    Bayes.train = function (text, label) {
        registerLabel(label);
        var words = tokenize(text);
        var length = words.length;
        for (var i = 0; i < length; i++)
            incrementStem(words[i], label);
        incrementDocCount(label);
    };

    Bayes.guess = function (text) {
        var words = tokenize(text);
        var length = words.length;
        var labels = getLabels();
        var totalDocCount = 0;
        var docCounts = {};
        var docInverseCounts = {};
        var scores = {};
        var labelProbability = {};
        
        for (var j = 0; j < labels.length; j++) {
            var label = labels[j];
            docCounts[label] = docCount(label);
            docInverseCounts[label] = docInverseCount(label);
            totalDocCount += parseInt(docCounts[label]);
        }
        
        for (var j = 0; j < labels.length; j++) {
            var label = labels[j];
            var logSum = 0;
            labelProbability[label] = docCounts[label] / totalDocCount;
           
            for (var i = 0; i < length; i++) {
                var word = words[i];
                var _stemTotalCount = stemTotalCount(word);
                if (_stemTotalCount === 0) {
                    continue;
                } else {
                    var wordProbability = stemLabelCount(word, label) / docCounts[label];
                    var wordInverseProbability = stemInverseLabelCount(word, label) / docInverseCounts[label];
                    var wordicity = wordProbability / (wordProbability + wordInverseProbability);

                    wordicity = ( (1 * 0.5) + (_stemTotalCount * wordicity) ) / ( 1 + _stemTotalCount );
                    if (wordicity === 0)
                        wordicity = 0.01;
                    else if (wordicity === 1)
                        wordicity = 0.99;
               }
           
                logSum += (Math.log(1 - wordicity) - Math.log(wordicity));
                log(label + "icity of " + word + ": " + wordicity);
            }
            scores[label] = 1 / ( 1 + Math.exp(logSum) );
        }
        return scores;
    };
    
    Bayes.extractWinner = function (scores) {
        var bestScore = 0;
        var bestLabel = null;
        for (var label in scores) {
            if (scores[label] > bestScore) {
                bestScore = scores[label];
                bestLabel = label;
            }
        }
        return {label: bestLabel, score: bestScore};
    };

    return Bayes;
})(Bayes || {});

localStorage.clear();

var go = function go() {
    var text = document.getElementById("test_phrase").value;
    var scores = Bayes.guess(text);
    var winner = Bayes.extractWinner(scores);
    document.getElementById("test_result").innerHTML = winner.label;
    document.getElementById("test_probability").innerHTML = winner.score;
    console.log(scores);
};

// Festival mail training
Bayes.train("Please click the link above to access your mobile boarding pass(es). To quickly retrieve and display your mobile boarding pass, you should save the image on your mobile device. Once at the airport, show this mobile boarding pass: - at Curbside where available, Self-Service Kiosks or the American Airlines counter if you are checking baggage, - at the security checkpoint, - during the boarding of your flight.If you forget your cell phone or mobile device, or delete the link to your boarding pass by mistake, you can print a paper boarding pass at a Self Service Machine or American Airlines Ticket Counter. For your convenience, a paper boarding pass has also been attached to this email. If you have access to a printer, you can print your paper boarding pass(es) before proceeding to the airport. The attached document is not a mobile boarding pass and will not be accepted at the security checkpoint if displayed from your mobile device. Thank you for choosing American Airlines.", 'nofestival');

Bayes.train("Hi everyone! Finally, the hack has started! :D Here are the slides from Johan Wallin´s Spotify API-presentation. Best of luck - Hack Out West crew", 'nofestival');
Bayes.train("Hej. Vi bekräftar att ditt webbutrymme för domänen har sagts upp. Webbutrymme kommer att raderas den 2016-11-10. Ditt webbutrymme kommer att fortsätta vara fullt funktionellt fram till utgångsdatumet. Kontakta vår support om du vill flytta din domän till en annan leverantör, så att vi kan hjälpa dig att göra flytten så smidig som möjligt. Om du har sagt upp mindre än 30 dagar innan förnyelsedatumet så har abonnemanget redan förnyats ytterligare ett år. Kontrollera ifall du har några utestående fakturor. Om du skulle ångra ditt beslut, så kan du häva din uppsägning i webbutrymmets kontrollpanel fram till det datum som det är 30 dagar kvar till utgångsdatumet. Ditt webbutrymme kommer att raderas på utgångsdatumet. Glöm inte att göra en backup på alla data som du vill behålla innan 2016-11-10.Tack för att du använder våra tjänster. Om du har några frågor, så kan du kontakta vår chattsupport dygnet runt på one.com/chat eller nå oss via e-post på: support@se.one.com Kontakta vår support genom att svara på detta e-postmeddelande om du har några frågor. Vi beklagar att du har valt att säga upp ditt webbhotellsabonnemang för domänen skixuellt.com. Vi hoppas att du varit nöjd med våra tjänster och att vi får chansen att välkomna dig tillbaka som kund i framtiden. Med vänlig hälsning One.com", 'nofestival');
Bayes.train("And the link :Dhttps://docs.google.com/presentation/d/1I5EVHBKkMIstZDhZjy1VyKeBJ9m12uHqf1Ct2w92uVI/edit#slide=id.g7979e433d_1_27On Tue, Aug 9, 2016 at 9:48 AM, Tomas Sellden <tsellden@spotify.com> wrote:Hi everyone!Finally, the hack has started! :DHere are the slides from Johan Wallin´s Spotify API-presentation.Best of luck- Hack Out West crew-- Tomas SelldénSpotify Street TeamChalmers University of TechnologyPhone: +(46) 736 93 19 75Email: tsellden@spotify.com-- Tomas SelldénSpotify Street TeamChalmers University of TechnologyPhone: +(46) 736 93 19 75Email: tsellden@spotify.com", 'nofestival');
Bayes.train("Tzar Welcomes you to ÜBER 4.3.16This is a private party, for members only(If you have received this email you are a member)Location: sockerbruket 20 (Hey It's Enricos Palazzo)Take the tram or bus to Vagnhallen majorna Entrance through courtyardDoors: 22:00-7:00  Age:20+ (no exceptions)  Membership fee for this night: 150kr Free entry before  23:00 Please!  Bring your id card as proof of membership.  Bring cash.  No smoking inside.  Show respect to each other.Be Free. OBSIf you received this email, you are already a registered member  Line-up:  Bernard Horn [Sthlm] (Esperanto Musik)  22:00-03:00Raised in a musical family, Bernard switched his guitar for two turntables and a mixer in his early adolescence. Lying about his young age, he held a residency at Berns Gallery 2:35:1, which took him further into the underground dance music scene of StockholmBernard has since then conquered the remaining part of the capital city, showcasing his record collection of playful rhythms and organic sounds all over Stockholm at places such as Trädgården, Riche and Musikaliska.https://soundcloud.com/esperantomusicswe/esperanto-music-002-bernhard-horn Eli Verveine [Schweiz] (Tardis records/Solid Am) 3:00-07:00When someone like Marshall Jefferson speaks, you listen. And it’s definitely a compliment, what the House originator once told Zurich based DJ Eli Verveine: „You sound just like from my hood in Chicago.“. As flattering as such a notion is, and as rough and rumbling as her mixes can be, one would be hard-pressed to see Eli Verveine’s craft as a Windy City phenomenon. Deejaying, it’s a mission. In the case of Eli Verveine, a long period of intense experimentation and self-discovery led to the sensitive, instinctive and insightful DJ she now is. Honing her skills at the legendary Dachkantine club or at her weekly radio show at Zurich’s Radio Lora, it was not before long that she garnered enthusiastic responses with her refined mix tapes: the most prominent of which Eli did for the reknowned techno doyens at the mnml ssgs-blog.If Eli has a knack for something, then it’s probably to tell her story of the deep over the course of an evening. Though she also expertly likes to unroll the carpet as an intro dj. „When you garner the first screams from a crowd while playing your last tracks, then you can be certain you have done a good job.“ says Eli. Right. But let’s rather hope you see her playing that early-morning sunset-set (ok, let’s call it a „sun-set“): Trust in Eli and you will most likely be blown away by a high-octane affair. Swoosh!https://soundcloud.com/eli-verveine/ra-325-eli-verveine This email was sent to  why did I get this?    unsubscribe from this list    update subscription preferences Tzar booking, event and management · http://www.tzar.events · Goteborg 41261 · Sweden.", 'festival');

// Spanish Training
Bayes.train("El ex presidente sudafricano, Nelson Mandela, ha sido hospitalizado la tarde del sábado, según confirmó un hospital de Pretoria a CNN. Al parecer se trata de un chequeo médico que ya estaba previsto, relacionado con su avanzada edad, según explicó el portavoz de la presidencia Sudafricana Mac Maharaj.", 'nofestival');
Bayes.train("Ticket holder must arrive prior to Ten P.M. PST (10:00 PM) or entry will not be guaranteed. Ticket includes all applicable taxes. Must be 21 years of age or older with a valid I.D. to enter. Proper nightlife attire required. Our tickets are a final sale. No refund, exchange, or cancellation possible. Management reserves all rights. Omnia Nightclub | FAQs Omnia Nightclub Gaslamp Quarter 454 6th Avenue San Diego, CA 92101 Unsubscribe Manage Preferences This email is being sent by the Hakkasan Group and on behalf of its affiliates. 6385 S RAINBOW BLVD | SUITE 800 LAS VEGAS, NV 89118 (702) 212-8804 Learn More Privacy Policy CHECK-IN POLICY In order to be granted access, you must submit your electronic ticket printout containing your security barcode OR DISPLAY IT ON YOUR PHONE SCREEN for scanning validation along with a Government-issued photo ID matching the name on the ticket. This unique barcode contains the total quantity of tickets purchased for each online transaction. Only one printout would be necessary if all the guests are arriving at the same time. To gain entry to the event, you would also be required to present one form of Government-issued photo identification matching the name printed on the ticket. PHOTO IDENTIFICATION A current, valid photo ID is required of every patron visiting our Nightclub and all guests must be 21+ strict. The following forms of ID are acceptable: ACCEPTED (As long as it is not expired) PROHIBITED - United States, Canada, England, Ireland, European Issued Drivers Licenses or DMV Identification Cards (If they are not stamped not to verify ID) - Passports (as long as there are no missing pages, not laminated or handwritten and not expired) - Military ID Cards - Mexico Voter ID Cards - Laminated paper driver's license or Identity cards - Paper ID’s are not accepted - Mexico Matricula Consular ID (current) - Mexico Matricula Consular ID (old) - United States Issued ID stamped Not For Identification - Work or student IDs and photo cards - International Student ID Cards (any type) - International Drivers Documents (License) - Handwritten Passport - Passport issued when you were a child or teen (cannot verify photo of the person presenting the Passport) TRANSFER POLICY - NAME ON TICKET - TICKET PURCHASE AS A GIFT If the legitimate ticket purchaser is not physically accompanying you, a photocopy of his/her valid photo ID matching his/her name on the ticket would still be required in order for you and the guests to be granted access. In the situation of a barcode valid for multiple tickets, guests may also be entering separately without the presence of the legitimate ticket purchaser. Consequently, each guest must show a full version of the e-ticket through a mobile device screen or have on hand a photocopy of the electronic ticket barcode along with a photocopy of the photo ID of the ticket purchaser, matching the name on the ticket. This standard admission policy is meant at protecting you in order to prevent unauthorized duplication of your valid ticket printout. If you have transferred your electronic ticket to a third party or traded your ticket printout via a third party ticket service, the above admission policy would also apply. Ticket holders not complying to this check-in policy would not be admitted and the electronic tickets would not be refunded. DRESS CODE Dress Code is upscale fashionable attire. We do not permit: hats, sandals, sneakers, hard soled shoes and boots, ripped or baggy clothing and athletic wear. Collared shirts are required for men. NOTICE REGARDING RELEASE OF LIABILITY By accepting entrance to the venue, the holder of this ticket expressly assumes all risk incident to the performance, whether occurring prior to, during or subsequent to the actual performance, and agrees that Hakkasan Holdings, LLC, and all managers, members, employees, agents, officers, and directors of Hakkasan Holdings, LLC, its affiliates and subsidiaries, are hereby released from any and all claims arising from or related to the performance, including claims of negligence, whether resulting in damage to person or property. Disclaimers: HOLDER VOLUNTARILY ASSUMES ALL RISKS AND DANGER INCIDENTAL TO THE EVENT FOR WHICH THE TICKET IS ISSUED, WHETHER OCCURRING PRIOR TO, DURING OR AFTER THE EVENT. HOLDER VOLUNTARILY AGREES THAT THE MANAGEMENT, FACILITY, LEAGUE, PARTICIPANTS, PARTICIPATING CLUBS, VENUE DRIVER, AND ALL OF THEIR RESPECTIVE AGENTS, OFFICERS, DIRECTORS, OWNERS AND EMPLOYEES ARE EXPRESSLY RELEASED BY HOLDER FROM ANY CLAIMS ARISING FROM SUCH CAUSES. This ticket is not subject to any refund and shall bear no cash value. If issued complimentarily, this ticket shall not be exchangeable. IN THE EVENT OF A CANCELLATION OR RESCHEDULING OF THE APPLICABLE EVENT, MANAGEMENT SHALL NOT BE REQUIRED TO ISSUE A REFUND PROVIDED THAT YOU ARE GIVEN THE RIGHT, WITHIN TWELVE MONTHS OF THE DATE OF THE ORIGINAL EVENT, TO ATTEND A RESCHEDULED PERFORMANCE OF THE SAME EVENT OR TO EXCHANGE THIS TICKET FOR A TICKET, COMPARABLE IN PRICE AND LOCATION, TO ANOTHER SIMILAR EVENT AS DESIGNATED BY MANAGEMENT EXCEPT AS OTHERWISE PROVIDED BY LAW. Certain maximum resale premiums and restrictions may apply such as: PA - $5 or 25% of the ticket price, whichever is greater, plus lawful taxes; MA - $2; CT - a reasonable charge, but not more than $3; NJ - $3 or 20% of the ticket price (or 50% of acquisition price if registered broker or season ticket holder), whichever is greater, plus lawful taxes. Purchaser may be able, in some instances, to purchase tickets directly from the venue box office without paying Venue Driver's surcharge fee. In NY: if the venue to which this ticket grants admission seats 6000 or fewer persons, this ticket may not be resold for more than 20% above the price printed on the face of this ticket, whereas if the venue to which this ticket grants admission seats more than 6000 persons, this ticket may not be resold for more than 45% above the price printed on the face of this ticket; this ticket may not be resold within one thousand five hundred feet from the physical structure of this place of entertainment under penalty of law if capacity exceeds 5,000. Management reserves the right, without the refund of any portion of the ticket purchase price, to refuse admission to or eject any person whose conduct is deemed by management to be disorderly, who uses vulgar or abusive language or who fails to comply with these or other management rules. Breach of any of the foregoing will automatically terminate this license. NO REFUNDS. NO EXCHANGES EXCEPT AS PROVIDED HEREIN. EVENT DATE & TIME SUBJECT TO CHANGE. ALL RIGHTS RESERVED. This ticket is a revocable license and admission may be refused upon refunding the face amount of the ticket. Unlawful resale or attempted resale is grounds for seizure and cancellation without compensation. Tickets obtained from unauthorized sources may be lost, stolen or counterfeit, and if so are void. Holder agrees by use of this ticket, not to transmit or in transmitting any description, account, picture, or reproduction of the game, performance, exhibition or event for which this ticket is issued. Holder acknowledges that the event may be broadcast or otherwise publicized, and hereby grants permission to utilize holder's image or likeness in connection with any live or recorded transmission or reproduction of such event In conformance with some local requirements or certain facility rules, alcoholic beverages, illegal drugs, controlled substances, cameras, recording devices, bundles and containers of any kind may not be brought into the premises. This ticket cannot be replaced if lost, stolen or destroyed, and is valid only for the event and seat for which it is issued. This ticket is not redeemable for cash. It is unlawful to reproduce this ticket in any form. Unless indicated otherwise, prices include all applicable taxes and/or cash discounts (if available).", 'festival');
Bayes.train("Fwd: Gigantisk dagsfest i GBG med RMH Sound nu på torsdag!Gigantisk dagsfest i GBG med RMH Sound nu på torsdag. Appelgren Friedner 1år– RMH SOUND – Dagsfest! Appelgren Friedner fyller 1 år och bjuder tillsammans med Keysopendoors in till den ultimata starten på festivalhelgen - en GIGANTISK DAGSFEST mitt i centrala GBG!Live:RMH SOUND - http://www.rmhsweden.com/DJ's:YOLO IGHEGÄRIGHETERANNA WESTERSLACKIN CREWSäkra er biljett för snabbare inträde här:http://billetto.se/dagsfestFacebook event: http://po.st/dagsfestGår även utmärkt att köpa biljett i dörren.20 år.TORSDAG 11/8 14.00-18.00Kajskjul 8, Packhusplatsen 11, GöteborgTack till Njie, Pripps Grön & Garage Hard Lemon Appelgren Friedner 1års fest – RMH SoundKajskjul 8, Packhusplatsen 11, 41113 GöteborgUppdatera dina inställningar eller Avregistrera dig", 'festival');
Bayes.train(" Your order is confirmed. Have a great time! This is not your ticket! Your ticket is attached to this email. Please print the attached PDF and bring it to the event. Your order number is #096056215157. Look below for your full order details, or click through to My Account on ticketfly.com. Event Information FNGRS CRSSD CRSSD FESTIVAL Odesza, Chet Faker, Loco Dice, Tale of Us, Hot Since 82, HI-LO, Jamie Jones, Claude VonStroke, Gorgon City, Tycho, Gesaffelstein, Ben UFO, Julio Bashmore, Lee Foss, Green Velvet, Tiga, Skream, Jeremy Olander, Cassian, J. Phlip, Ardalan, Will Clarke, Gryffin, Skylar Spence, Sam Gellaitry, Sacha Robotti, Lee K, Colour Vision Sat March 5, 2016  –  Sun March 6, 2016 12:00 PM Waterfront Park San Diego 1600 Pacific Highway San Diego, CA 21 and over Map             Order Details #096056215157 General Admission - General Sale 1 - Weekend Pass 1 ticket x $135.00 $135.00 Delivery method Print At Home Facility Fee $6.00 Service Fee $22.56 Total $163.56 A charge on your credit card will appear from Ticketfly Events Please note: No refunds or exchanges are permitted. You might also like CRSSD FESTIVAL - Weekend Express Entry Pass Sat 03/05 $25 MARK FARINA Thu 02/04 $5 - $15 JEREMY OLANDER Fri 02/05 $0 - $15 View All → Billed to Card #:     **** **** **** 0332 Type:     Visa 830 Felspar Street San Diego, CA United States 92109 Customer Support  •  My Account", 'festival');
Bayes.train("TZAR Presents:  Wednesday: JOEL MULL (PARABEL, DRUMCODE, TRUESOUL, MOOD) at Yaki-DaStarting DJing and producing in 1993, Joel Mull's career spans over two decades. He has released music on labels worldwide and along with Cari Lekebusch, Robert Leiner, Adam Beyer and Jesper Dahlbäck he counts to the first wave of Swedish techno producer who became known around the world as the . In the mid 90's Joel moved to Hamburg and worked as a resident DJ for 3 years at one of the biggest techno clubs in Germany, Unit Club. This was an important period for him and as a DJ with the many hours in DJ booth; It learned him how to control the energy of the night on the dance floor, from warm up sets to 10h marathon sets. As a producer, he is constantly active and has released over 100 releases and under various names such as Icarus and recently Gotzkowsky on the label Dystopian.Joel is constantly touring and traveling around the world almost every weekend and playing at the main clubs and festivals in the scene. In 2015 he started up the label Parabel together with the agency Parabel Music, focusing on releasing music from their own roster, with a first EP from Patrick Siech. The second release was out October 2015, with Joel himself. https://soundcloud.com/parabelmusic/parabel-podcast-02-joel-mullhttps://youtu.be/eKkMUlQOEAE  Friday: Evigt Mörker and Lego visits Anton Kristianssons ReleasepartyAnton Kristiansson's EP 'Aloe Vera' is released and it is celebrated with a concert / performance beyond the ordinary, and two of the best techno DJs. Secret location, you know the rest. Doors: 22:00 - 07:00Membership fee for this night: 100krCash only Lineup:Live on stage:Anton Kristiansson med David Sabel, Saga Åska & gästerDjs: Evigt Mörker (Parabel) (Sthlm)https://soundcloud.com/evigtmorkerLego (Parabel) (Sthlm) https://soundcloud.com/saralegokanerva    Please!  Bring your id card as proof of membership.  Bring cash.  No smoking inside.  Show respect to each other.Be Free. This is a members only party.You need to be a member of TZAR förening.registration: http://www.tzar.events/#!register/c3an                       This email was sent to why did I get this?    unsubscribe from this list    update subscription preferences Tzar booking, event and management · http://www.tzar.events · Goteborg 41261 · Sweden", 'festival');

Bayes.train(" Your order is confirmed. Have a great time!This is not your ticket! Your ticket is attached to this email. Please print the attached PDF and bring it to the event.Your order number is #096056215157. Look below for your full order details, or click through to My Account on ticketfly.com.Event Information FNGRS CRSSDCRSSD FESTIVALOdesza, Chet Faker, Loco Dice, Tale of Us, Hot Since 82, HI-LO, Jamie Jones, Claude VonStroke, Gorgon City, Tycho, Gesaffelstein, Ben UFO, Julio Bashmore, Lee Foss, Green Velvet, Tiga, Skream, Jeremy Olander, Cassian, J. Phlip, Ardalan, Will Clarke, Gryffin, Skylar Spence, Sam Gellaitry, Sacha Robotti, Lee K, Colour VisionSat March 5, 2016  –  Sun March 6, 201612:00 PMaterfront Park San Diego1600 Pacific HighwaySan Diego, CA21 and overMap    Share on Facebook       Share on Twitter        Share on Google Plus     Order Details   #096056215157 General Admission - General Sale 1 - Weekend Pass 1 ticket x $135.00 $135.00 Delivery method     Print At HomeFacility Fee    $6.00Service Fee     $22.56 Total   $163.56 A charge on your credit card will appear from Ticketfly Events Please note: No refunds or exchanges are permitted.You might also like CRSSD FESTIVAL - Weekend Express Entry Pass Sat 03/05 $25 MARK FARINA Thu 02/04 $5 - $15 JEREMY OLANDER Fri 02/05 $0 - $15 View All Billed to Card #:         **** **** **** 0332 Type: 830 Felspar Street San Diego, CA United States 92109", 'festival')
Bayes.train("mån 1 aug. 2016 kl 09:08Subject: Order confirmation for COLORS Game Over - Walshy Fire (Major Lazer)To:your order.event.COLORS Game Over - Walshy Fire (Major Lazer)order id.3677931Thank you for your order. This is your confirmation email, with your ticket(s) to the event attached. Have fun!Your ticket is attached to this e-mail in PDF format.In order to access the event you'll need to display the attached ticket(s) when you arrive. You can either print the attached PDF or simply display your ticket(s) on your phone.the fun stuff.time.Aug 03 2016 21:00location.FrihamnenPostcode and city:417 55Göteborgorganiser.Colors contact.mattias@inkgraphix.comPayment detailstransaction id.14077651transaction date.Aug 01 2016 09:07payment type.MasterCardcard number.XXXX XXXX XXXX 9124Ticket buyerName:Hampus RamströmE-mail:the details.tickets.price in SEK.2 x Colors Game Over ticketSEK 400.00Ticket feeSEK 20.00total:SEK 420.00Incl. VATVAT detailsInk Productions ABOrganisation number SE5568397672016% VATSEK 22.64BillettoOrganisation number 3256908025% VATSEK 4.00The ticket is only reimbursed by the organiser and only in case of cancellation of the event.As stated in our terms and conditions, ticket fees and payment handling fees are not refunded. Please find the details of your refund below.Contact·Support·Terms·Visit Billetto©2016BillettoSlussplan 11111 30Stockholm", 'festival');
Bayes.train("Ticketmaster Order for HARD Summer Music Festival - 2-Day PassTo: ﻿Order ConfirmationJuly 5, 2015﻿Thanks Johan - the event countdown is on!This email is NOT your ticket. See “Delivery” below.﻿Order #: 5-28723/LA1﻿﻿﻿﻿﻿﻿﻿HARD Summer Music Festival - 2-Day PassFairplex At Pomona, Pomona, CASat, Aug. 1, 2015﻿General Admission ticket in Section GA112﻿﻿TELL YOUR FRIENDS﻿﻿Total Charges:﻿$222.30﻿﻿DELIVERY﻿View My Tickets  |  Order Details﻿﻿﻿Delayed - Standard MailTickets will be shipped 4-6 weeks before the festival﻿﻿﻿﻿﻿Why worry? Get info now about adding Event Ticket Insurance to your order!﻿FOLLOW US﻿﻿﻿﻿GO MOBILE﻿﻿﻿﻿HELPFUL LINKSView My TicketsMy AccountHelp With This OrderOrder DetailsOrder HistoryManage My Alerts﻿BEFORE YOU GOVenue InfoGet Ticket Insurance﻿TICKET ACTIONSBuyTransfer﻿Find more fun: Music | Sports | Arts & Theatre | Family This email confirms your order! Your purchase will be finalized after the usual credit card approval and billing address verification. Questions? Please don't hit reply, we won't see them. Instead find your answer fast in our FAQs or just ask us here. You can also write to us. Ticketmaster, Attn: Fan Support, 1000 Corporate Landing, Charleston, WV 25311 P.S. If the event is changed, postponed, or canceled for any reason we'll update it on our site. © 2015 Ticketmaster. All rights reserved. Ticketmaster | About Us | Update Email Preferences | Terms of Use | Privacy Policy | International", 'festival');
Bayes.train("ack för att du köpte dina biljetter genom Ticketmaster och valde eBiljett som leveranssätt. Ditt bokningsnummer är: 020291044﻿Evenemang/Artiklar:﻿Parham  (PUSTERVIK)﻿OBS! Om du i samband med ditt biljettköp även köpt avbeställningsförsäkring och/eller andra produkter så bifogas även dessa i detta email. Säkerställ att du skriver ut och tar med rätt biljetter till evenemanget. Övriga värdebevis eller bekräftelser gäller ej för inpassering.﻿﻿Var hittar jag biljetten?Biljetten finns bifogat i detta email som en PDF. Biljetten sparas dessutom under Mitt Konto vilket gör att du alltid har åtkomst till den även om du inte har din e-post tillgänglig. På Mitt Konto kan du också hämta en mobilanpassad biljett om du går in på sidan med din mobiltelefon. Använd samma loginuppgifter som vid köpet. Hur sparar jag min eBiljett på telefonen?När du öppnat biljetten bör du spara ner biljetten på telefonen så att du lätt kan hitta den senare. Det kan du göra i appar som iBooks eller Adobe Acrobat. Du kan också ta en skärmdump av biljetten och spara den i ditt bildgalleri på telefonen. Jag kan inte öppna biljetten, vad gör jag?Kontrollera att du har en PDF-läsare. Här kan du ladda hem Adobe Acrobat Reader. Hur visar jag upp biljetten vid evenemanget?Utskriven biljett: För säker inpassering, skriv ut biljetten på ett A4-papper (färg eller sv/v spelar ingen roll). Klipp inte i din utskrivna biljett utan ta med dig hela utskriften till evenemanget. Förminska eller förstora heller inte utskriften. Kontrollera att biljettens streckkod har god utskriftskvalitet för att undvika problem i entrén.Mobilbiljett: Öppna filen i din telefon och visa upp den i entrén till evenemanget. Spara gärna ner biljetten i din telefon i appar som iBooks eller Adobe Acrobat, för enklare hantering i entrén. Kan jag skriva ut min biljett fler gånger?Ja, din biljett är sparad som en PDF och kan skrivas ut hur många gånger som helst. Men var rädd om din biljett och behandla den som en värdehandling. Vi ber dig t ex vara försiktig med att skriva ut biljetten i offentliga miljöer där den lätt kan hamna i fel händer. Undvik också att sprida bilder på din biljett i sociala medier som Facebook eller Instagram. Den enskilda biljettens streckkod ger rätt till 1 st inträde. Skulle någon obehörig få tag i en kopia av din eBiljett riskerar du att bli stoppad vid inpassering.﻿Med vänlig hälsning,Ticketmaster Mitt Konto | Kundservice | Ticketmaster.se © 2016 Ticketmaster Sverige. All rights reserved.", 'festival');
Bayes.train("ej Hampus, Tack för din bokning!Observera att detta endast är en bekräftelse och gäller inte som biljett.﻿Bokningsnummer: 020291044Antal artiklar: 2Totalt belopp: 400,00 kr (inkl. serviceavgifter)﻿Leveranssätt: eBiljett﻿Du har valt leveranssättet eBiljett. Biljetten levereras som en PDF i ett separat email. Biljetten sparas dessutom under Mitt Konto vilket gör att du alltid har åtkomst till den även om du inte har din e-post tillgänglig. Vill du ha en mobilanpassad eBiljett så kan du ladda ner den genom att gå in på Mitt Konto med din mobiltelefon.﻿Betalningssätt: Master﻿﻿Slut på bläck? Beställ på InkClub!﻿Med vänlig hälsning,Ticketmaster﻿﻿﻿﻿Event: Parham på PUSTERVIKDatum: 2016-05-13 22:00Antal biljetter: 2﻿Platser:﻿Sektion Ståplats   Ordinarie﻿Sektion Ståplats   Ordinarie﻿   ﻿﻿Artikel﻿Antal﻿Belopp﻿﻿﻿Biljetter, Parham﻿2016-05-13 22:00﻿ORD﻿2﻿360,00 kr﻿﻿Moms 25%﻿25.00 %﻿0,00 kr﻿Moms 12%﻿12.00 %﻿0,00 kr﻿Moms 6%﻿6.00 %﻿20,38 krPusterviksbiljetter, orgnr: 969673-0879﻿﻿Serviceavgifter﻿﻿﻿﻿40,00 kr﻿﻿Moms 25%﻿25.00 %﻿8,00 kr﻿Ticnet AB, orgnr: 556401-2887﻿Summa﻿400,00 kr﻿﻿ScandicBoka hotell hos oss!﻿﻿FacebookGilla Ticketmaster påFacebook!﻿﻿InkClubSlut på bläck?Beställ på InkClub! Mitt Konto | Kundservice | Ticketmaster.se © 2016 Ticketmaster Sverige. All rights reserved.", 'festival');
Bayes.train("Thank you! Your order with Coachella - Weekend 1 has been successfully processed. Order #33433315 Questions about your order? Contact Us! Your information Billing Address Per Thoresson 830 Felspar st San Diego, CA 92109 Shipping Address Per Thoresson 830 Felspar street San Diego, CA 92109 General Admission Festival Pass with Shuttle Combo Friday, April 15 2016 - Sunday, April 17 2016 at Empire Polo Club 81-800 Avenue 51 Indio, CA - 92201 Doors at 11:00AM All Ages More Details Ticket Quantity Price GA Festival/Shuttle Pass 2 $918.00 Event Subtotal: $918.00 Delivery Information: Domestic Shipping ($0.00) Orders will begin shipping in late February/early March. Weekend 1 orders will be shipped first, followed by Weekend 2. Please be sure your shipping address is correct during check out. Once your order ships, a tracking email will be sent to you.  Orders unable to be delivered under any circumstances (lost/stolen/errors/not home/forgot/dog scared the postman away/aliens/returned to sender) will be required to be picked up at will call. For full details regarding shipping please visit www.coachella.comTERMS OF SALE. Tickets sold through this website grant to the Customer only a revocable license to the bearer that may be revoked at any time for any reason. Resale or attempted resale of any ticket issued hereunder at a price higher than the face value appearing thereon is grounds for seizure and cancellation without compensation. To re-read the entire terms of sale, please visit http://www.frontgatetickets.com/support/terms/ Please visit support.frontgatetickets.com with any questions.Need help finding a hotel? - SEARCH HERE Delivery Charge: $0.00 Order Total: $918.00 Find more shows in your area >>", 'festival');
Bayes.train("Hej Hampus! Vi hoppas att du får det trevligt på 28/10 CRYSTAL CASTLES/STRAND på Debaser Strand. Dörrarna öppnas kl 19:00 28 oktober 2016 Evenemanget startar kl 19:00 Hornstulls Strand 4, Stockholm Biljettinformation Ladda ner biljett(er) Ladda ner din biljett/dina biljetter genom att trycka på knappen ovan,eller via adressen: https://download.tickster.com/ku8vldp2ju Ditt köp har referensnummer: KU8VLDP2JU Och passa gärna på att boka bord i någon utav våra restauranger innan giget. Läs mer här: http://debaser.se/restauranger/ Kvitto Artikel Antal Pris Moms Total 28/10 CRYSTAL CASTLES/STRAND 1 325,00 kr (6%) 18,40 kr 325,00 kr Serviceavgift 1 25,00 kr (6%) 1,42 kr 25,00 kr Summa 19,81 kr 350,00 kr Tid: 2016-08-01 09:15:11 Debaser Hornstulls Strand 9 11739 Stockholm Momsnummer: SE-556530-7591 Detta köp har genomförts via tickster.com (SE5566300272). För att komma i kontakt med oss, ring 0771-47 70 70 eller maila support@tickster.com. Det går även bra att svara på detta mail.", 'festival');
Bayes.train("Shadow Hills RV Resort 40-655 Jefferson StINDIO Ca 92203 7603604040 info@shadowhillsrvresort.comshadowhillrvresort.com Booking Confirmation ID: 5102830 Booking Information Booking Details Site Type: Festival Tent Camping Arriving: 14-Apr-2016 Adults: 2 Departing: 18-Apr-2016                 RV Sites Type: *Tent                RV Sites Length: *Tent                  RV Sites Slide: None Rate: Festival Tent Camping Total: 300.00 Site Type Charge: Booking Total: 300.00 300.00           Booking Amount:     300.00                                                                                          Booking Total:      300.00          Deposit Required:   300.00          Amount Paid:    300.00          Amount Owing:   0.00 Guest Details Name Address Contact Per Thoresson 830 Felspar StreetSan DiegoCA92109UnitedStates  Special Requirements Per ThoressonJohan Backman Travel Directions We are located off Interstate 10 in Indio, California just 20 miles east of Palm Springs. From the Phoenix area take the I-10 west. From the Los Angeles area take the I-10 east. Exit Jefferson St./Indio Blvd. (Exit 139). Go North on Jefferson St. 1/4 mile. Enter on the left at Sun City Blvd. Please call office from your cell phone to get the gate code if you do not already have it. Terms & Conditions SPECIAL EVENTS Coachella & Stagecoach Festivals, and Party in the Pasture: There are NO refunds on special event cancellations. Cancellation Policy: Daily- Cancellations made 3 or more days prior to the reservation date are subject to a $25.00 cancellation fee, if less than 3 days prior to the reservation date, there are no refunds. Weekly- Cancellations made 7 or more days prior to the reservation date are subject to a $50.00 cancellation fee, if less than 7 days prior to the reservation date, there are no refunds. Monthly- Cancellations made 45 or more days prior to the reservation date are subject to a $100.00 cancellation fee, if less than 45 days prior to the reservation date, there are no refunds. Change Policy: One change to your reservation is allowed without incurring a service charge within 12 months of your reservation. Changes are subject to site availability. NO SPECIFIC SITE IS GUARANTEED The entire amount will be charged at time of reservation. This property is privately owned. We reserve the right to refuse service to anyone and will not be responsible for accidents nor injury to guests or for loss of money or valuables of any kind. The Resort provides parking escorts as a service to our guests. The resort provides Wi-Fi, cable, electric, sewer, water, and propane service as a convenience to our guests. Guests are solely responsible for any damages to their property, or Resort property occurring during arrival, parking or departure. I agree to read and comply with all of Shadow Hills RV Resort rules and regulations as posted in the office and/or around the resort. I authorize Shadow Hills RV Resort to charge my credit and/or debit card for any unpaid charges including rent, property damage, electric usage and any other incidentals. I understand that no refunds will be issued for early check out. You hereby specifically agree to the above. Our resort is a private gated community. When you arrive, please enter the code provided in your second confirmation email on the access keypad to open the gate. The Resort Office is to the left. If you arrive during non-office hours, please find your personalized Welcome Packet on the board outside the office. There is a member of our resort staff available to assist you. Please feel free to call us @ (760) 360-4040 if we can be of service. Cancellation Policy SPECIAL EVENTS Coachella Festival & Stagecoach, and Party in the Pasture: There are NO refunds on special event cancellations. Daily: Cancellations made 3 or more days prior to the reservation date are subject to a $25.00 cancellation fee, if less than 3 days prior to the reservation date, there are no refunds. Weekly: Cancellations made 7 or more days prior to the reservation date are subject to a $50.00 cancellation fee, if less than 7 days prior to the reservation date, there are no refunds. Monthly: Cancellations made 45 or more days prior to the reservation date are subject to a $100.00 cancellation fee, if less than 45 days prior to the reservation date, there are no refunds. Change Policy: One change to your reservation is allowed without incurring a service charge within 12 months of your reservation. Changes are subject to site availability. NO SPECIFIC SITE IS GUARANTEED The entire amount will be charged at time of reservation. This property is privately owned. We reserve the right to refuse service to anyone and will not be responsible for accidents nor injury to guests or for loss of money or valuables of any kind. The Resort provides parking escorts as a service to our guests. The resort provides Wi-Fi, cable, electric, sewer, water, and propane service as a convenience to our guests. Guests are solely responsible for any damages to their property, or Resort property occurring during arrival, parking or departure. I agree to read and comply with all of Shadow Hills RV Resort rules and regulations as posted in the office and/or around the resort. I authorize Shadow Hills RV Resort to charge my credit and/or debit card for any unpaid charges including rent, property damage, electric usage and any other incidentals. I understand that no refunds will be issued for early check out. You hereby specifically agree to the above.", 'festival');
Bayes.train("Order ConfirmationJuly 5, 2015﻿Thanks Per - the event countdown is on!This email is NOT your ticket. See “Delivery” below.﻿Order #: 5-28745/LA1﻿﻿﻿﻿﻿﻿﻿HARD Summer Music Festival - 2-Day PassFairplex At Pomona, Pomona, CASat, Aug. 1, 2015﻿General Admission ticket in Section GA112﻿﻿TELL YOUR FRIENDS﻿﻿Total Charges:﻿$222.30﻿﻿DELIVERY﻿View My Tickets  |  Order Details﻿﻿﻿Delayed - Standard MailTickets will be shipped 4-6 weeks before the festival﻿﻿﻿﻿﻿Why worry? Get info now about adding Event Ticket Insurance to your order!﻿FOLLOW US﻿﻿﻿﻿GO MOBILE﻿﻿﻿﻿HELPFUL LINKSView My TicketsMy AccountHelp With This OrderOrder DetailsOrder HistoryManage My Alerts﻿BEFORE YOU GOVenue InfoGet Ticket Insurance﻿TICKET ACTIONSBuyTransfer﻿Find more fun: Music | Sports | Arts & Theatre | Family This email confirms your order! Your purchase will be finalized after the usual credit card approval and billing address verification. Questions? Please don't hit reply, we won't see them. Instead find your answer fast in our FAQs or just ask us here. You can also write to us. Ticketmaster, Attn: Fan Support, 1000 Corporate Landing, Charleston, WV 25311 P.S. If the event is changed, postponed, or canceled for any reason we'll update it on our site. © 2015 Ticketmaster. All rights reserved. Ticketmaster | About Us | Update Email Preferences | Terms of Use | Privacy Policy | International", 'festival');
Bayes.train("LÅT SEMESTERN GÖRA COMEBACK I HÖST Just nu har vi bra priser på utvalda höstresor till Europa. Boka senast måndag 15 augusti.Hej, Hösten är den perfekta årstiden för en minisemester. Du kan fortfarande äta frukost i solen och strosa runt på helgens marknader. Eller kanske ta en titt i dina favoritbutiker och sedan krypa in i biomörkret. Just nu har vi bra priser till utvalda resmål i Europa, boka senast 15 augusti för resa 1 september-30 november 2016. Hälsningar från SAS WE ARE TRAVELERS", 'nofestival');
Bayes.train("Hej! Här kommer ett litet urval av jobb från Cruitway som vi tror passar dig. Du kan alltid ställa in din matchning här. - Cruitway Team Game Programmer Rovio HELTID I STOCKHOLM Researcher Ericsson HELTID I STOCKHOLM Project manager who wants to support Saab Business Saab HELTID I JÄRFÄLLA Junior Data Analyst Rovio", 'nofestival');
Bayes.train("Hi, hackoutwest16 has invited you to join the hackoutwest2016/partymode repository. Visit https://github.com/hackoutwest2016/partymode/invitations to accept or decline this invitation. You can also head over to https://github.com/hackoutwest2016/partymode to check out the repository. Some helpful tips: - If you get a 404 page, make sure you're signed in as. - Too many emails from hackoutwest16? Block them by visiting  https://github.com/hackoutwest2016/partymode/invitations and clicking the 'Block user' button. --- View it on GitHub: https://github.com/hackoutwest2016/partymode", 'nofestival');
Bayes.train("Intresserad av vinsterna med automatisering av IT? – det här är din inbjudan till VMworld 2016! BARCELONA FIRA BARCELONA GRAN VIA 17 – 20 OKTOBER 2016 Registrera dig här  CTA arrow Välkommen till VMworld, årets största IT-händelse i Barcelona! VMworld har attraherat ca 10 000 besökare i flera år. Vi ger dig 3 dagar av visioner, strategier, tekniska deep-dives, hands-on labs och mycket mycket mer! I år är vi glada om ni vill vara med oss när vi lanserar våra nyheter kring SDDC (Software Defined Data Center) och Cloud. Ni kommer att få se, höra och lära er mer om våra innovativa lösningar runt privata, publika och specialiserade moln samt Mega-Clouds. shadow-table En flexibel och skalbar lösning får du genom att: checkmark-wh   Accelerera SDDC på privata moln. Genom förenkling och industrialisering av SDDC kan man förbättra livscykelhanteringen och automatiseringen av SDDC för att säkra verksamhetens nytta och acceptans. checkmark-wh    Förlänga ditt private moln. Genom att förlänga ditt private moln med vSphere och dess kontrollplan till vCloud Air och andra publika moln, får vi hybridfunktionalitet och SDDC-As-a-Service för hela din IT-miljö. checkmark-wh    Distribuera kontrollplanet. Genom att ha ett gemensamt distribuerat kontrollplan över ditt privata och publika moln få du en enhetlig hantering av inte bara dina virtuella maskiner, men också virtuella nät, lagring samt nya typer av applikationsteknologier som containers. shadow-table Inte nog med att du kommer hem inspirerad av nya trender, strategier och visioner inom just ditt område, du kommer även att knyta en hel del nya kontakter och få med dig erfarenheter du sent kommer att glömma. Det lovar vi! Registrera dig här  CTA arrow The Software-Defined Data Center Hoppas vi ses i Barcelona! Hälsningar, VMware teamet", 'nofestival');
Bayes.train("Eaux Claires 2016", 'festival');
Bayes.train("Warped Tour 2016", 'festival');
Bayes.train("The Wrecking Ball 2016", 'festival');
Bayes.train("The Peach Music Festival 2016", 'festival');
Bayes.train("Summer Set Music Festival 2016", 'festival');
Bayes.train("Camp Barefoot 2016", 'festival');
Bayes.train("MAHA Music Festival 2016", 'festival');
Bayes.train("Folks Festival 2016", 'festival');
Bayes.train("Philadelphia Folk Festival 2016", 'festival');
Bayes.train("Hoxeyville 2016", 'festival');
Bayes.train("Breakaway 2016", 'festival');
Bayes.train("Imagine Festival 2016", 'festival');
Bayes.train("FYF Fest 2016", 'festival');
Bayes.train("Psycho Las Vegas 2016", 'festival');
Bayes.train("Ohana Festival 2016", 'festival');
Bayes.train("Project Pabst 2016", 'festival');
Bayes.train("Afropunk 2016", 'festival');
Bayes.train("Bumbershoot 2016", 'festival');
Bayes.train("North Coast Music Festival 2016", 'festival');
Bayes.train("Electric Zoo 2016", 'festival');
Bayes.train("Backwoods Music Festival 2016", 'festival');
Bayes.train("Ultra Music Festival", 'festival');
Bayes.train("Vegoose", 'festival');
Bayes.train("Wanee Festival", 'festival');
Bayes.train("SmokeOut Festival", 'festival');
Bayes.train("Rockfest", 'festival');
Bayes.train("Pitchfork Music Festival", 'festival');
Bayes.train("Electric Zoo Festival", 'festival');
Bayes.train("Metaltown Festival", 'festival');
Bayes.train("Umeå Open", 'festival');
Bayes.train("Storsjöyran", 'festival');
Bayes.train("Svenska dansbandsveckan", 'festival');
Bayes.train("Uppsala Reggae Festival", 'festival');
Bayes.train("Bråvalla", 'festival');
Bayes.train("Arvika", 'festival');
Bayes.train("We Are Sthlm", 'festival');
Bayes.train("Way Out West", 'festival');