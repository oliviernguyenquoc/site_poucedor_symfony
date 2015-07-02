<?php

namespace Pouce\SiteBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Pouce\TeamBundle\Entity\TeamRepository;
use Pouce\SiteBundle\Entity\EditionRepository;

class RankingController extends Controller
{
    public function rankingAction($idEdition)
    {
        $repository = $this ->getDoctrine() 
                            ->getManager()
                            ->getRepository('PouceTeamBundle:Result');

        $results= $repository->getAllResultsInEdition((int)$idEdition);

        self::rankingCalculus($results);

        //exit(\Doctrine\Common\Util\Debug::dump($users));
        
        return $this->render('PouceSiteBundle:Site:ranking.html.twig', array(
          'results' => $results,
        ));
    }

    //Recalcule toutes les rangs et stock les nouvelles valeurs dans la base de données 
    private function rankingCalculus($results){
        $rang=0;
        $rangAdd=0;
        $ancienneDistance=0;

        $em = $this->getDoctrine()->getManager();

        foreach($results as $result)
        {
            if($result->getPosition()->getDistance()!=$ancienneDistance)
            {
                $rang+=1;
                $rang+=$rangAdd;
                $rangAdd=0;
            }
            else
            {
                $rangAdd+=1;
            }
            $result->setRank($rang);
            $em ->persist($result);
            $ancienneDistance=$result->getPosition()->getDistance();
        }

        $em->flush();

    }
}
