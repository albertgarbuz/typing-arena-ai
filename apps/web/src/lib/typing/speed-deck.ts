import type { Layout } from "./types";

// Each scene has five openings, five developments and four endings.
const scenes = {
  ru: [
    ["На перроне пахло кофе|Утром вокзал почти пустовал|Дождь стучал по крыше вокзала|У кассы лежала забытая карта|На табло появился наш поезд","Мы выбрали места у окна|Проводник помог поднять чемодан|В вагоне кто-то тихо напевал|Сосед достал путевой дневник|За стеклом поплыли фонари","Впереди был целый день пути|К обеду показались горы|За рекой начинался новый город|Мы считали мосты до самой станции"],
    ["На кухне открыли окно|К ужину пришли друзья|На столе стояла корзина яблок|В чайнике зашумела вода|Из печи потянуло теплом","Кот устроился возле тёплой плиты|Мы накрыли стол у окна|Бабушка достала синюю чашку|За чаем разговорились о лете|Младший брат нарезал хлеб","Вечер прошёл удивительно быстро|За окном медленно темнело|Напоследок всем налили чай|Рецепт записали на память"],
    ["Тропа уходила к перевалу|Над лесом рассеялся туман|Поход начался у моста|В рюкзаке звякнула кружка|У подножия было прохладно","Вдали блеснула полоска снега|Мы остановились у ручья|Ветер гнал облака на восток|На карте нашли короткую тропу|Орёл сделал круг над склоном","На привале поделились чаем|Обратно решили идти вдоль реки|В блокноте появился набросок гор|До сумерек успели в лагерь"],
    ["В мастерской включили свет|На полке лежали кисти|В углу стоял новый холст|У окна пахло краской|К полудню собрались художники","На бумаге проступил силуэт дома|Мы смешали два оттенка синего|Художница отступила на шаг|Карандаш зашуршал по бумаге|Свет лёг на край палитры","Работу оставили сохнуть у окна|В альбоме подписали дату|Каждый заметил свою деталь|Эскиз пригодится для выставки"],
    ["В порту качались лодки|Над пирсом летали чайки|Море за ночь стихло|В бухте показался парус|У причала ждали рыбаки","Матрос аккуратно свернул канат|На волне блеснула серебристая рыба|Капитан сверился с картой|По воде прошла лёгкая рябь|Вдалеке прозвучал гудок","Берег ещё долго был виден|К вечеру зажгли маяк|Путь домой указали огни порта|На палубе стало тихо"],
    ["В библиотеке начался тихий час|На полке нашлась старая книга|В читальном зале открыли окна|За стойкой перебирали журналы|По стеклу пробежала тень ветки","Между страницами лежал сухой лист|В каталоге нашёлся знакомый автор|На полях виднелись пометки|Мы прочли вслух первую строчку|У окна освободилось кресло","Главу дочитали до конца|Название записали в блокнот|Книгу посоветовали другу|Время пролетело за чтением"],
    ["В саду пахло влажной землёй|После дождя выглянуло солнце|За калиткой цвела сирень|Вдоль забора распустились маки|У дома поставили лейку","На ветку села синица|Мы подвязали молодой саженец|На листе дрожала капля|Дорожку посыпали мелким песком|В траве застрекотали кузнечики","Перед уходом полили цветы|К вечеру сад наполнился тенью|На завтра оставили ещё одну грядку|Первые ростки отметили на плане"],
    ["На стадионе зажгли свет|Команда вышла на дорожку|Тренер поставил секундомер|У старта собрались бегуны|На трибуне подняли флаг","Первый круг прошли спокойно|У поворота прибавили шаг|Зрители поддержали последнего бегуна|Ветер слегка мешал на прямой|Команда держала ровный темп","На финише пожали друг другу руки|Тренер записал время круга|После забега все долго пили воду|Следующий старт назначили на субботу"],
    ["В зале настраивали гитару|За сценой зажёгся свет|На репетицию принесли ноты|У рояля стояла скамейка|Первый аккорд разбудил пустой зал","Барабанщик тихо отсчитал такт|Мелодию подхватили скрипки|Певица попросила сыграть тише|Бас задал ровный ритм|Музыканты повторили припев","Последний звук растаял в тишине|Финал решили сыграть ещё раз|Уходя напевали знакомый мотив|Ноты сложили до концерта"],
    ["Ночью погасли огни посёлка|На холме поставили телескоп|Низко над крышей висела луна|К сумеркам небо прояснилось|Из окна была видна яркая звезда","Мы нашли на карте созвездие|Над горизонтом медленно плыл спутник|Облако ненадолго закрыло луну|В тетради появился рисунок неба|Глаза постепенно привыкли к темноте","До рассвета оставался целый час|Наблюдение записали в дневник|Наутро показали снимок друзьям|К востоку небо начало светлеть"]
  ],
  en: [
    ["The station smelled of coffee|A train pulled into the station|Rain tapped the platform roof|A folded map lay on the bench|The board showed our train","We found two window seats|The guard lifted a heavy bag|A child counted the passing lights|Our neighbour opened a travel diary|The carriage filled with quiet chatter","By noon the mountains appeared|Beyond the river lay a new city|We counted bridges until the next stop|There was a whole day of travel ahead"],
    ["The kitchen window stood open|Friends arrived in time for supper|A basket of apples sat on the table|Water began to boil|Heat drifted from the oven","The cat settled near the stove|We laid the table by the window|Someone found the blue cups|Over tea we talked about summer|My brother sliced the bread","We wrote down the recipe|Outside the light slowly faded|Everyone stayed for one more cup|The evening flew by"],
    ["The trail led to a mountain pass|Mist lifted from the forest|Our hike began at a bridge|A cup rattled in the pack|The air was cool at the foot of the hill","Snow shone on a distant peak|We stopped beside a stream|Wind pushed the clouds east|The map showed a shorter trail|An eagle circled above the ridge","We shared tea at the next stop|The river led us home|We sketched the peaks in a notebook|We reached camp before dark"],
    ["The studio lights came on|Brushes lined the shelf|A fresh canvas stood in the corner|The room smelled of paint|The artists gathered at noon","A house took shape on paper|We mixed two shades of blue|The painter stepped back|A pencil moved across the page|Light fell on the palette","The picture dried by the window|We dated the sketch|Everyone noticed a different detail|The drawing went into the show"],
    ["Boats rocked in the harbour|Gulls flew above the pier|The sea was calm at dawn|A sail appeared in the bay|Fishers waited at the dock","A sailor coiled a rope|A silver fish broke the surface|The captain checked the chart|A ripple crossed the water|A horn sounded in the distance","The coast stayed in sight for hours|At dusk the lighthouse shone|The harbour lights guided us home|The deck grew quiet"],
    ["The library was quiet|An old book turned up on a shelf|The reading room windows were open|The librarian sorted the journals|A branch cast a shadow on the glass","A leaf lay between two pages|We found a familiar author|There were notes in the margin|Someone read the first line aloud|A chair by the window was free","We finished the chapter|The title went into a notebook|We recommended the book to a friend|Time passed quickly as we read"],
    ["The garden smelled of rain|The sun appeared after a shower|Lilacs bloomed by the gate|Poppies lined the fence|A watering can stood by the house","A bird landed on a branch|We tied up a young tree|A drop trembled on a leaf|Fine sand covered the path|Crickets chirped in the grass","We watered the flowers before leaving|By evening shade filled the garden|One bed was left for tomorrow|We marked the first shoots on the plan"],
    ["The stadium lights came on|The team walked onto the track|The coach set a watch|Runners gathered at the start|A flag rose above the stands","The first lap was steady|We picked up speed on the bend|The crowd cheered the last runner|A headwind slowed the group|The team kept an even pace","At the finish everyone shook hands|The coach noted the lap time|The runners stopped for water|The next race was set for Saturday"],
    ["A guitar was being tuned|A lamp lit the empty stage|The players brought their music|A bench stood by the piano|A chord rang through the hall","The drummer counted the beat|The violins took up the tune|The singer asked for a softer sound|The bass kept a steady rhythm|The band repeated the chorus","The final note faded away|They played the ending once more|Everyone hummed on the way home|The music was put away for the concert"],
    ["The village lights went out|We set a telescope on the hill|The moon hung above the roof|At dusk the sky cleared|A bright star shone through the window","We found a constellation on the map|A satellite crossed the horizon|A cloud hid the moon|Someone drew the night sky|Our eyes adjusted to the dark","Dawn was still an hour away|We wrote down what we saw|The next day we showed a friend the picture|The eastern sky grew pale"]
  ]
};
const size = 1000;
type Deck = { remaining: number[]; last: number };
const memory: Partial<Record<Layout, Deck>> = {};
export function drawSpeedText(layout: Layout): string {
  const key = "typing-arena-speed-deck-v1-"+layout;
  let deck = memory[layout];
  try {
    const raw=localStorage.getItem(key);
    if(raw){
      const data=JSON.parse(raw);
      if(Array.isArray(data.remaining) && data.remaining.length<size &&
         data.remaining.every((n: number)=>Number.isInteger(n)&&n>=0&&n<size) &&
         new Set(data.remaining).size===data.remaining.length) deck=data;
    }
  } catch { /* Keep the session deck when storage is unavailable. */ }
  if(!deck?.remaining.length){
    const pool=Array.from({length:size},(_,i)=>i);
    for(let i=size-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [pool[i],pool[j]]=[pool[j],pool[i]];
    }
    if(pool[size-1]===deck?.last) [pool[0],pool[size-1]]=[pool[size-1],pool[0]];
    deck={remaining:pool,last:-1};
  }
  const n=deck.remaining.pop()!;
  deck.last=n;
  memory[layout]=deck;
  try {localStorage.setItem(key,JSON.stringify(deck))} catch { /* Session memory remains available. */ }
  const [opening,middle,ending]=scenes[layout][Math.floor(n/100)];
  return [opening.split("|")[Math.floor(n/20)%5],middle.split("|")[Math.floor(n/4)%5],ending.split("|")[n%4]].join(". ")+".";
}
