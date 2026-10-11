/*
 * Passwords that are used so often that guessing them is the first thing an
 * attacker tries. Registration rejects any of these, ignoring letter case.
 *
 * The list is compiled from widely reported weak passwords and patterns. It is
 * not an official or exhaustive list, and it is a small first line of defence,
 * not a substitute for a long, unique password. Short entries are
 * harmless: the length rule already rejects them.
 */
const RAW = `
password password1 password12 password123 password1234 password12345 password123456
password1! password! passw0rd passw0rd1 p@ssw0rd p@ssword p@ssw0rd1 pa55word
pa55w0rd password01 password02 password11 password2 password3 password99
password2020 password2021 password2022 password2023 password2024 password2025
password2026 mypassword mypassword1 mypassword123 mypass123 yourpassword newpassword
newpassword1 letmein123 letmein1 letmein! iloveyou iloveyou1 iloveyou2 iloveyou123
iloveyou! iloveyou12 iloveyou69 ilovemyself ilovemom ilovedad iloveu123 ilovegod
ilovehim ilovejesus 12345678 123456789 1234567890 12345678910 123456789012
12345678901 1234567891 11111111 111111111 1111111111 22222222 222222222 33333333
44444444 55555555 66666666 77777777 88888888 99999999 00000000 000000000 0000000000
123123123 123123123123 12312312 112233445 11223344 1122334455 112233445566 12341234
123412341234 12121212 123321123 123454321 12345654321 987654321 9876543210 98765432
87654321 876543210 654321654 13579246 1357924680 24681357 135792468 147258369
159753456 159357852 741852963 963852741 789456123 7894561230 456789123 321654987
369258147 147852369 123654789 123789456 123456123 123456123456 1234567812345678
1q2w3e4r 1q2w3e4r5t 1q2w3e4r5t6y 1q2w3e4r5t6y7u8i 1qaz2wsx 1qaz2wsx3edc 1qazxsw2
1qazxsw23edc 1qaz1qaz 1q2w3e4r! 1q2w3e 1qazzaq1 1qaz@wsx 1qay2wsx 1a2b3c4d
1a2b3c4d5e 1a2s3d4f 1a2s3d4f5g 1z2x3c4v 1z2x3c4v5b zaq12wsx zaq1xsw2 zaq1zaq1
zaq1@wsx qwerty123 qwerty1234 qwerty12345 qwerty123456 qwertyui qwertyuiop
qwertyuiop1 qwertyuiop123 qwertyuiop[] qwerty12 qwerty1 qwerty! qwerty987 qwerty321
qwertyqwerty qwertyuiopasdfghjkl qwe12345 qwe123456 qwe123qwe qweasdzxc qweasdzxc123
qwerasdf qazwsxedc qazwsx123 qazwsx12 qazwsxedcrfv qazxswedc qazwsxedc123 qazplm123
qazqaz123 asdfghjk asdfghjkl asdfghjkl1 asdfghjkl; asdf1234 asdf12345 asdfasdf
asdfasdfasdf asdfg123 asdfgh123 asdfghjkl123 asdf123456 asdf1234! zxcvbnm1
zxcvbnm123 zxcvbnm, zxcvbnmasdfghjkl zxcvbnm12 zxcvbnm! zxcv1234 zxcvbnmzxcvbnm
zxcasdqwe zxcasdqwe123 azertyuiop azerty123 azerty1234 azertyuiop123 azertyazerty
abcd1234 abcd12345 abcd123456 abcd123! abcdefgh abcdefghi abcdefghij abcdefgh1
abcdefg123 abc12345 abc123456 abc123abc abcabc123 abcabcabc abcdabcd abc123!@#
abcd@1234 abcd#1234 abcd!234 abcd1234! abcdef123 abcdef123456 abcdefg1 abc12345678
aaaaaaaa aaaaaaaaa aaaaaaaaaa aaaa1111 aaaa1234 aaaaaa11 aaaaaa123 aaa11111 bbbbbbbb
cccccccc dddddddd eeeeeeee ffffffff gggggggg hhhhhhhh iiiiiiii jjjjjjjj kkkkkkkk
llllllll mmmmmmmm nnnnnnnn oooooooo pppppppp qqqqqqqq rrrrrrrr ssssssss tttttttt
uuuuuuuu vvvvvvvv wwwwwwww xxxxxxxx yyyyyyyy zzzzzzzz qqqqqqqqqq wwwwwwwwww qqqq1111
qqqqwwww qqqqqq11 qqqqqq123 qqww1122 qqwweerr q1w2e3r4 q1w2e3r4t5 q1w2e3r4t5y6
q1w2e3r4t5y6u7 q1w2e3r4! q1w2e3r4t5y6u7i8o9p0 q1w2e3r4t5y6u7i8 qaz123456 qazwsx1234
qwaszx12 qwaszxcv qweqweqwe qwerty11 admin123 admin1234 admin12345 admin123456
admin@123 admin@1234 admin#123 administrator administrator1 admin1 adminadmin
adminpassword adminadmin1 admin2020 admin2021 admin2022 admin2023 admin2024
admin2025 admin! admin@2024 admin@2025 admin@2026 root1234 root12345 rootroot
rootpassword toor1234 test1234 test12345 test123456 testtest testing1 testing123
testing12 test@123 test@1234 testpass testpassword guest123 guest1234 guest12345
guestguest user1234 user12345 user123456 username username1 username123 useruser
default1 default123 changeme changeme1 changeme123 changeit changeit1 temp1234
temp12345 temp123456 temporary temporary1 temp@123 welcome1 welcome12 welcome123
welcome1234 welcome12345 welcome! welcome@123 welcome#1 welcome2020 welcome2021
welcome2022 welcome2023 welcome2024 welcome123! welcome01 login123 login1234
loginlogin loginpass secret123 secret1234 secret12 secretsecret mysecret mysecret1
supersecret superman1 superman123 superman! superuser super123 supersecret1 sysadmin
system123 manager1 manager123 master123 master1234 mastermaster masterkey masterkey1
mastermind qazmlp123 trustno1 trustno1! trustnoone dragon123 dragon1234 dragonball
dragonball1 dragon12 dragon! dragons1 dragonfly monkey123 monkey1234 monkey12
monkeys1 monkey!! monkeybutt mickey123 mickeymouse minnie123 shadow123 shadow1234
shadow12 shadow1! shadows1 shadowman sunshine sunshine1 sunshine12 sunshine123
sunshine! sunshine2 sunshine7 sunny123 sunny1234 sunflower sunflower1 princess
princess1 princess12 princess123 princess! princess2 princesa princesse princess01
princess7 football football1 football12 football123 football! footballer footballs
football2 football7 football11 baseball baseball1 baseball12 baseball123 basketball
basketball1 basketball12 basketball23 soccer12 soccer123 soccer1234 soccer11
hockey123 hockey12 cricket123 cricket1 cricket12 cricket@123 cricketer volleyball
volleyball1 tennis123 tennis12 golfgolf golf1234 swimming1 wrestling batman123
batman1234 batman12 batman! batmanbatman spiderman spiderman1 spiderman123 spider123
spiderman2 ironman1 ironman123 starwars starwars1 starwars123 starwars12 startrek
startrek1 pokemon1 pokemon123 pokemon12 pokemon! naruto123 naruto12 narutouzumaki
goku1234 gokugoku jordan23 jordan123 jordan12 michael1 michael12 michael123 michael!
michelle michelle1 jessica1 jessica12 jessica123 jennifer jennifer1 jennifer12
jennifer123 amanda12 amanda123 ashley123 ashley12 ashley1 ashleigh brandon1
brandon123 daniel123 daniel12 daniel1 daniel! danielle danielle1 matthew1 matthew12
matthew123 andrew123 andrew12 andrew1 joshua123 joshua12 joshua1 joshua! nicholas
nicholas1 nicole123 nicole12 nicole1 samantha samantha1 samantha12 jasmine1
jasmine123 jasmine12 jasmine! hannah12 hannah123 hannah1 elizabeth elizabeth1
elizabeth12 victoria victoria1 victoria123 alexander alexander1 alexander12
alexandra alexandra1 alexis123 alexis12 christian christian1 christina christina1
christopher christopher1 christine christine1 charlie1 charlie12 charlie123 charlie!
charlotte charlotte1 george123 george12 thomas123 thomas12 thomas1 william1
william12 william123 benjamin benjamin1 benjamin12 jonathan jonathan1 steven123
stephanie stephanie1 melissa1 melissa12 melissa123 jackson1 jackson5 jackson12
jackson123 chelsea1 chelsea123 chelsea12 madison1 madison12 madison123 taylor12
taylor123 taylor1! tiffany1 lauren12 lauren123 rachel12 rachel123 rebecca1 rebecca12
rebecca123 elephant elephant1 butterfly butterfly1 butterfly12 butterfly! mustang1
mustang12 mustang123 mustang! corvette1 corvette camaro12 camaro123 ferrari1
ferrari12 ferrari123 porsche1 porsche911 mercedes mercedes1 mercedes123 bmw12345
audi1234 toyota12 toyota123 honda123 honda1234 hondacivic nissan123 yamaha12
yamaha123 harley123 harley12 harleydavidson cowboys1 cowboys12 steelers steelers1
patriots patriots1 yankees1 yankees12 yankees123 redsox12 lakers123 lakers24
liverpool liverpool1 liverpool12 liverpool123 chelsea! arsenal1 arsenal123 arsenal12
manchester manutd123 manunited barcelona barcelona1 barcelona10 realmadrid
realmadrid1 juventus juventus1 messi1010 messi1234 messi123 ronaldo7 ronaldo123
ronaldo12 ronaldo1 neymar11 mumbaiindians chennai123 chennai1 mumbai123 mumbai1
delhi123 delhi1234 kolkata123 bangalore bangalore1 bangalore123 hyderabad hyderabad1
hyderabad123 pune1234 jaipur123 india123 india1234 india12345 india@123 india@1234
india2020 india2021 india2022 india2023 india2024 india2025 india1947 india1234!
indian123 indian1234 indiaindia bharat123 bharat1234 jaihind123 jaihind jaihind1
jaishreeram jaishreeram1 jaishriram jaimatadi jaimatadi1 jaisairam jaisairam1
omnamahshivaya omnamahshivay omnamah omsairam omsairam1 omsairam123 harharmahadev
harekrishna harekrishna1 radhakrishna radhakrishna1 radhekrishna radhekrishna1
radheradhe radheradhe1 radhe123 krishna123 krishna1234 krishna12 krishna@123
krishna! krishna1 shiva123 shiva1234 shiva@123 shivashiva shiv1234 shivam123
shivam1234 ganesh123 ganesh1234 ganesha1 ganeshji hanuman123 hanuman1 hanuman@123
ramram123 ramram1234 ramayan1 sairam123 sairam1234 sairam@123 saibaba1 saibaba123
waheguru waheguru1 waheguru123 allah1234 allah12345 bismillah bismillah1
bismillah786 mashallah allahu123 mohammed1 mohammad1 muhammad1 muhammad12
muhammad123 ahmed123 ahmed1234 ali12345 786786786 7867867867 786786786786 rahul123
rahul1234 rahul12345 rahul@123 rahul@1234 rahul1 rahulrahul amit1234 amit12345
amit@123 amit@1234 amitamit sumit123 sumit1234 sumit@123 rohit123 rohit1234
rohit12345 rohit@123 rohit@1234 rohitsharma ankit123 ankit1234 ankit@123 ankit12345
vikas123 vikas1234 vikas@123 vijay123 vijay1234 vijay@123 vijay12345 ajay1234
ajay12345 ajay@123 sanjay123 sanjay1234 sanjay@123 sandeep1 sandeep123 sandeep@123
deepak123 deepak1234 deepak@123 manish123 manish1234 manish@123 mahesh123 mahesh1234
mahesh@123 suresh123 suresh1234 suresh@123 ramesh123 ramesh1234 ramesh@123 rajesh123
rajesh1234 rajesh@123 rakesh123 rakesh1234 rakesh@123 mukesh123 mukesh1234 dinesh123
dinesh1234 anil1234 anil12345 anil@123 sunil123 sunil1234 sunil@123 nitin123
nitin1234 nitin@123 pankaj123 pankaj1234 pankaj@123 gaurav123 gaurav1234 gaurav@123
saurabh1 saurabh123 saurabh@123 abhishek abhishek1 abhishek123 abhishek@123 akash123
akash1234 akash@123 aakash123 aman1234 aman12345 aman@123 aman@1234 arjun123
arjun1234 arjun@123 karan123 karan1234 karan@123 varun123 varun1234 varun@123
tarun123 tarun1234 tushar123 yash1234 yash12345 yash@123 harsh123 harsh1234
harsh@123 harshit1 harshit123 kunal123 kunal1234 kunal@123 mohit123 mohit1234
mohit@123 naveen123 naveen1234 naveen@123 praveen1 praveen123 praveen@123 prasad123
prakash1 prakash123 prakash@123 kiran123 kiran1234 kiran@123 ravi1234 ravi12345
ravi@123 raviraj1 rajeev123 rajkumar rajkumar1 ashok123 ashok1234 anand123 anand1234
anand@123 arun1234 arun12345 arun@123 ganesh@123 priya123 priya1234 priya@123
priya12345 pooja123 pooja1234 pooja@123 pooja12345 neha1234 neha12345 neha@123
neha@1234 sneha123 sneha1234 sneha@123 anjali123 anjali1234 anjali@123 kavita123
kavita1234 sunita123 sunita1234 sunita@123 anita1234 anita12345 anita@123 sonia123
sonia1234 sonam123 sonam1234 sonam@123 divya123 divya1234 divya@123 shweta123
shweta1234 shruti123 shruti1234 swati123 swati1234 nisha123 nisha1234 nisha@123
ritu1234 ritu12345 komal123 komal1234 komal@123 meena123 meena1234 geeta123
geeta1234 seema123 seema1234 rekha123 rekha1234 manju123 manju1234 radha123
radha1234 sita1234 gita1234 laxmi123 laxmi1234 lakshmi1 lakshmi123 durga123
durga1234 saraswati parvati1 mahadev1 mahadev123 mahakal1 mahakal123 bholenath
bholenath1 jaibholenath iloveindia iloveindia1 mumbaikar delhiboy1 punjabi1
punjabi123 punjab123 punjab1234 gujarat1 gujarat123 kerala123 kerala1234 tamilnadu
tamilnadu1 chennai@123 kolkata1 bengal123 bengal1234 assam123 odisha123 bihar1234
bihar123 up12345678 up1234567 hindustan hindustan1 hindustani bollywood bollywood1
sharukh1 salmankhan salmankhan1 sachin10 sachin123 sachin1234 sachin@123
sachintendulkar virat123 virat1234 virat18 viratkohli viratkohli18 dhoni007
dhoni1234 dhoni@123 msdhoni7 msdhoni msdhoni07 cricketlover india@2020 india@2021
india@2022 india@2023 india@2024 india@2025 india@2026 google123 google1234
google12345 google@123 google! gmail123 gmail1234 gmail12345 gmail@123 yahoo123
yahoo1234 yahoo12345 hotmail1 hotmail123 outlook123 outlook1 facebook facebook1
facebook12 facebook123 facebook! facebook@123 instagram instagram1 instagram123
instagram@123 whatsapp whatsapp1 whatsapp123 twitter123 twitter1 snapchat snapchat1
snapchat123 youtube123 youtube1 youtube12 tiktok123 telegram1 linkedin linkedin1
linkedin123 github123 github1234 microsoft microsoft1 microsoft123 windows1
windows10 windows11 windows123 windows7 apple1234 apple12345 apple123 iphone12
iphone123 iphone1234 iphone13 iphone14 iphone15 samsung1 samsung123 samsung1234
android1 android123 android12 computer computer1 computer12 computer123 laptop123
laptop1234 internet internet1 internet12 internet123 networking network123 network1
wireless wifi1234 wifi12345 wifipassword wifi@123 router123 router1234 modem1234
server123 server1234 database database1 database123 mysql123 mysql1234 oracle123
oracle1234 python123 python1234 python12 python3 java1234 javascript javascript1
coding123 hacker123 hacker1234 hackme123 hackers1 hacker12 hackerman anonymous
anonymous1 anonymous123 matrix123 matrix1234 neo12345 terminal1 console1 keyboard
keyboard1 keyboard123 mouse1234 monitor1 printer1 testuser testuser1 testuser123
love1234 love12345 love123456 lovelove lovelove1 lovelove123 lovely123 lovely1234
lovers123 lover123 loveme123 loveme1234 loveyou1 loveyou123 loveyou2 loveyou12
love4ever lovemylife lovemelater loveforever forever1 forever12 forever123
foreverlove forever21 foreveryoung always123 always1234 alwaysforever together1
together123 sweetheart sweetheart1 sweetie1 sweetie123 sweetpea1 sweetness honey123
honey1234 honeybee1 honeybunny babygirl babygirl1 babygirl12 babygirl123 babyboy1
babyboy123 babydoll babydoll1 baby1234 baby12345 baby123456 angel123 angel1234
angel12345 angels1 angelica angelina angelina1 angelo123 angel1234! beautiful
beautiful1 beautiful12 beautiful123 gorgeous1 pretty123 pretty1234 prettygirl
cutie123 cutie1234 cutiepie cutiepie1 cupcake1 cupcake123 cookie123 cookie1234
cookies1 cookies123 chocolate chocolate1 chocolate12 chocolate123 cheese123 pizza123
pizza1234 pizzapizza hamburger banana123 banana1234 bananas1 apple1234! strawberry
strawberry1 cherry123 cherries1 orange123 orange1234 purple123 purple1234 purple12
purple! pink1234 pink12345 pinky123 yellow123 yellow1234 blue1234 blue12345
bluebird1 blueberry blueberry1 green123 green1234 greenday1 black123 black1234
blackcat1 blackjack blackjack1 blackberry blackberry1 white123 white1234 silver123
silver1234 golden123 goldfish1 diamond1 diamond123 diamonds1 rainbow1 rainbow12
rainbow123 rainbow6 sunrise1 sunset123 moonlight moonlight1 starlight starlight1
starshine stars1234 midnight midnight1 midnight12 midnight123 thunder1 thunder123
lightning lightning1 hurricane hurricane1 tornado123 winter123 winter1234 winter2020
winter2021 winter2022 winter2023 winter2024 summer123 summer1234 summer2020
summer2021 summer2022 summer2023 summer2024 summer2025 spring123 spring1234
spring2020 spring2021 spring2022 spring2023 spring2024 autumn123 autumn1234
monday123 monday1234 tuesday1 wednesday thursday1 friday123 friday1234 saturday1
sunday123 sunday1234 january1 january123 february1 february12 march1234 april1234
april12345 may12345 june1234 june12345 july1234 july12345 august123 august1234
september september1 october1 october123 november1 november12 december december1
december12 december25 christmas christmas1 christmas12 christmas123 xmas1234
newyear1 newyear2020 happy123 happy1234 happy12345 happy2020 happy2021 happy2022
happy2023 happy2024 happy2025 happybirthday happybday happyday1 happyhappy happyface
happylife happy1234! birthday birthday1 birthday12 birthday123 holiday1 holiday123
vacation vacation1 freedom1 freedom12 freedom123 freedom! freedom7 liberty1
liberty123 peace123 peace1234 peaceful1 victory1 victory123 winner123 winner1234
winner12 winners1 champion champion1 champion12 champion123 champions1 superstar
superstar1 superstar123 superstar! superhero1 hero1234 hero12345 heroes123 legend123
legend1234 legendary legendary1 warrior1 warrior12 warrior123 warriors1 soldier1
soldier123 ninja123 ninja1234 ninja12345 samurai1 samurai123 gladiator knight123
knights1 wizard123 wizard1234 magic123 magic1234 magician1 phoenix1 phoenix123
phoenix12 tiger123 tiger1234 tiger12345 tigers123 tigger12 tigger123 tigger1234
lion1234 lion12345 lions123 panther1 panther123 wolf1234 wolf12345 wolves123
eagle123 eagle1234 eagles123 falcon123 hawk1234 hawks123 shark123 shark1234 dolphin1
dolphin123 dolphins horse123 horse1234 horses123 pony1234 puppy123 puppy1234
puppies1 puppylove doggie123 doggy123 doggy1234 doggydog dog12345 dog123456 cat12345
cat123456 kitty123 kitty1234 kitten123 kitten1 kittens1 kitkat123 kitkat12 fluffy123
fluffy1234 buddy123 buddy1234 buddy12345 bella123 bella1234 max12345 maxmax123
charlie2 lucky123 lucky1234 lucky7777 luckyone luckyday lucky777 lucky13 rocky123
rocky1234 teddy123 teddybear teddy1234 bear1234 bears123 panda123 panda1234
pandabear koala123 bunny123 bunny1234 rabbit123 rabbit1 turtle123 turtle1 monkey007
donkey123 chicken1 chicken123 duckduck duckling parrot123 penguin1 penguin123
penguins unicorn1 unicorn123 unicorns dinosaur dinosaur1 godzilla godzilla1 pikachu1
pikachu123 mario123 mario1234 luigi123 zelda123 zelda1234 sonic123 sonic1234
minecraft minecraft1 minecraft123 fortnite fortnite1 fortnite123 roblox123
roblox1234 robloxian gamer123 gamer1234 gaming123 gaming1234 playstation
playstation1 xbox1234 xbox12345 nintendo nintendo1 nintendo64 callofduty warcraft
warcraft1 diablo123 halo1234 counterstrike iloveyou3000 iloveyou143 143143143
143iloveyou 14344343 143143 1432143214 andromeda apollo123 apollo13 galaxy123
galaxy1234 universe universe1 planet123 saturn123 jupiter1 jupiter123 mercury1
mercury123 venus123 neptune1 pluto123 orion123 orion1234 cosmos123 rocket123
rocket1234 rockstar rockstar1 rockstar123 rocknroll rockrock metallica metallica1
nirvana1 nirvana123 beatles1 beatles123 eminem123 eminem1234 slipknot slipknot1
linkinpark linkinpark1 blink182 blink1821 greenday guitar123 guitar1234 guitarist
piano123 piano1234 music123 music1234 musiclover music4life singer123 dancer123
dancing1 dancer1234 danceman bailey123 bailey1234 harley1234 secret1! secret1234!
trouble1 trouble123 whatever whatever1 whatever123 whatever12 nothing1 nothing123
something1 something123 anything1 anything123 everything1 everything123 nobody123
nobody1234 someone1 someone123 anyone123 iamthebest iamawesome iamgreat iamcool123
iamhappy1 iamsexy iamhere123 imhere123 imcool123 imnumber1 number1 number123
number1! number12 number1fan number1girl number1mom number1dad number1boy numberone
numberone1 bestfriend bestfriend1 bestfriends bestfriend123 bestfriends1 bff12345
friends1 friends12 friends123 friendship friendship1 family123 family1234
family12345 familia123 mother123 mother1234 father123 father1234 sister123
brother123 brother1234 mommy123 mommy1234 daddy123 daddy1234 mama1234 papa1234
grandma1 grandpa1 mamamama mamapapa school123 school1234 school12345 student1
student123 student1234 college1 college123 university teacher1 teacher123
teacher1234 doctor123 doctor1234 nurse1234 engineer1 engineer123 lawyer123 manager12
company1 company123 business1 business123 money123 money1234 money12345 money1!
moneymoney moneyman1 million1 millionaire billionaire dollar123 dollar1234 cash1234
cashmoney rich1234 richman1 richard1 richard12 richard123 hello123 hello1234
hello12345 hello1234! helloworld helloworld1 helloworld123 hellohello hello@123
hellokitty hellokitty1 goodluck goodluck1 goodluck123 goodmorning goodnight
goodgirl1 goodboy12 goodbye1 goodbye123 thankyou thankyou1 thankyou123 welcomehome
home1234 home12345 homesweethome house1234 house12345 mynameis mynameis1 myname123
myname1234 myspace1 myspace123 myworld1 mylife123 mylove123 mylove1234 mybaby123
myhome123 myself123 myemail123 myemail1 mypassw0rd mypasswrd mypass1234 mypass12345
thepassword thepassword1 thebest123 thebest1 theone123 thething1 thisisit1
thisismypassword thisisapassword ihatemylife ihateyou1 ihateyou123 ihatethis
fuckyou1 fuckyou123 fuckyou12 fuckyou! fuckoff1 fuckoff123 bullshit bullshit1
asshole1 asshole123 bitch123 bitch1234 bitches1 sexy1234 sexy12345 sexygirl
sexygirl1 sexyboy1 sexyman1 sexylady sexylady1 sexybabe1 hottie123 hottie1 hotstuff
hotmama1 hotgirl1 hotboy123 playboy1 playboy123 playgirl naughty1 lesbian1
lesbian123 stupid123 stupid1234 idiot123 idiot1234 loser123 loser1234 loser12345
looser123 dumbass1 dumbass123 dummy123 dummy1234 killer123 killer1234 killer12345
killerkiller killers1 killme123 killme1234 kill1234 deathnote death1234 death12345
deathdeath devil123 devil1234 devil666 devils123 satan666 satan123 666666666
6666666666 666999666 hell1234 hell12345 hellraiser hellboy1 hellfire1 demon123
demon1234 demons123 vampire1 vampire123 vampires zombie123 zombie1234 zombies1
ghost123 ghost1234 ghosts123 skull123 skeleton1 monster1 monster12 monster123
monsters1 predator1 terminator terminator1 gangster1 gangster123 gangsta1 gangsta123
thug1234 thuglife thuglife1 mafia123 mafia1234 godfather godfather1 scarface
scarface1 pimpin123 pimp1234 bigboss1 bigboss123 bigdaddy bigdaddy1 bigman123
bigguy123 biggirl1 bigbird1 bigbear1 bigfoot1 bigmac123 littlebit littleman
littlegirl littleboy lilwayne1 babyface babyboy12 loverboy loverboy1 lovergirl
ladyboy1 cowboy123 cowboy1234 cowgirl1 redneck1 redneck123 hillbilly country1
country123 countrygirl country12 nascar24 nascar1234 racing123 racecar1 racecar123
racer123 racerx12 speed123 speed1234 speedy123 turbo123 turbo1234 nitro123 super1234
super12345 super123456 ultra123 ultimate ultimate1 ultimate123 extreme1 extreme123
maximum1 maximus1 optimus1 optimusprime transformer transformers terminator2
predator2 aliens123 alien1234 avatar123 avatar1234 avengers avengers1 avengers123
thanos123 hulk1234 hulkhulk thor12345 captain1 captain123 captainamerica deadpool
deadpool1 wolverine wolverine1 xmen1234 joker123 joker1234 jokerjoker harleyquinn
catwoman1 superwoman wonderwoman wonderful wonderful1 wonderland1 aliceinwonderland
disney123 disney1234 disneyland frozen123 frozen1234 elsa1234 mulan123 aladdin1
simba123 simba1234 nemo1234 shrek123 shrek1234 spongebob spongebob1 spongebob123
patrick1 patrick123 scooby1 scooby123 scoobydoo scoobydoo1 snoopy123 snoopy1234
garfield garfield1 pooh1234 winniethepooh tweety123 bugsbunny looney123 simpsons
simpsons1 homer123 homer1234 bart1234 familyguy1 southpark southpark1 flintstones
gummybear gummy123 skittles skittles1 starburst oreo1234 oreo12345 nutella1
nutella123 pepsi123 pepsi1234 cocacola cocacola1 cocacola123 sprite123 fanta123
coffee123 coffee1234 coffee12345 coffeecoffee tea12345 beer1234 beer12345 beerbeer1
whiskey1 whiskey123 vodka123 vodka1234 tequila1 tequila123 party123 party1234
partytime partyboy1 partygirl dance123 dance1234 dancedance dancing queen123
queen1234 queenbee1 queenie1 king1234 king12345 kingkong1 kingkong123 kings123
kingdom1 kingdom123 royal123 royalty1 prince123 prince1234 princes1 lord1234
lordlord1 master12 mastercard godfather2 godisgood godislove godbless1 godbless123
godsend1 gods1234 jesus123 jesus1234 jesus12345 jesuschrist jesuslives jesusloves
jesus4ever jesussaves christ123 christ1234 church123 blessed1 blessed123 blessing1
grace123 grace1234 faith123 faith1234 hope1234 hope12345 trust123 trust1234 believe1
believe123 miracle1 miracle123 heaven123 heaven1234 heavenly1 paradise paradise1
paradise123 eternity eternal1 infinity infinity1 infinite1 destiny1 destiny123
fantasy1 fantasy123 mystery1 mystery123 secrets1 shadow! shadowfax silence1
silent123
`;

const ALL = new Set(RAW.split(/\s+/).filter(Boolean));

export const COMMON_PASSWORD_COUNT = ALL.size;

/* Letter case is ignored, so "Password1" and "PASSWORD1" both match. */
export function isCommonPassword(password: string): boolean {
  return ALL.has(password.toLowerCase());
}
