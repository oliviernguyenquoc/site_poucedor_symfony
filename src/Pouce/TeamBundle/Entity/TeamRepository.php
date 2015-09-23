<?php

namespace Pouce\TeamBundle\Entity;

use Doctrine\ORM\EntityRepository;

/**
 * TeamRepository
 *
 * This class was generated by the Doctrine ORM. Add your own custom
 * repository methods below.
 */
class TeamRepository extends EntityRepository
{
	
	public function getLastTeam($idUser)    
	{
        $qb = $this -> createQueryBuilder('t')
                    -> leftJoin('t.users','u', 'WITH', 'u.id = :idUser')
                    -> setParameter('idUser', $idUser)
                    -> orderBy('u.created','DESC')
                    ->setMaxResults(1)
                   ;
        return $qb->getQuery();    
    	}

    /**
	*	Retourne l'équipe du user qui concourra à la prochaine éidition
    */
    public function findNextRaceTeam($userId)
    {
        $now = new \DateTime();
        $qb = $this -> createQueryBuilder('t')
            -> leftJoin('t.users','u', 'WITH', 'u.id = :idUser')
             -> setParameter('idUser', $userId)
            -> join('t.edition','e','WITH','e.dateOfEvent > :today')
             ->setParameter('today', $now->format("Y-m-d"))
            -> orderBy('u.created','DESC')
            ->setMaxResults(1)
            ;
        return $qb->getQuery()->getSingleResult() ;   
    }

    public function findAllTeamsByEditionByUsers($userIdArray,$editionId)
    {
        $qb = $this -> createQueryBuilder('t')
            -> join('t.users','u')
            ->addSelect('u')
            -> where('u.id IN (:userIdArray)')
             -> setParameter('userIdArray', $userIdArray)
            -> join('t.edition','e')
            -> andWhere('e.id = :editionId')
             ->setParameter('editionId', $editionId)
            ->distinct()
            ;

        return $qb->getQuery()->getResult() ; 
    }

}
